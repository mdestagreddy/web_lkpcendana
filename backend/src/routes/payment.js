const express = require('express');
const router = express.Router();
const db = require('../database/db');
const Midtrans = require('midtrans-client');

let snap;
let isProduction;

function getSnap() {
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
        throw new Error('Midtrans credentials are not configured');
    }

    const currentIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (!snap || snap._isProduction !== currentIsProduction) {
        isProduction = currentIsProduction;
        snap = new Midtrans.Snap({
            isProduction,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY,
        });
    }
    return snap;
}

function getBaseUrl(req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
}

function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

router.post('/payment/create-transaction', async (req, res) => {
    const { program_id, customer_name, customer_email, customer_phone, amount } = req.body;

    if (!program_id || !customer_name || !customer_email || !customer_phone || !amount) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    try {
        const programs = await queryAsync('SELECT * FROM programs WHERE id = ? AND is_active = 1', [program_id]);
        if (programs.length === 0) return res.status(404).json({ error: 'Program tidak ditemukan' });

        const program = programs[0];
        const orderId = `REG-${Date.now()}-${program_id}`;
        const grossAmount = Math.round(parseFloat(amount));

        const transactionDetails = {
            order_id: orderId,
            gross_amount: grossAmount,
        };

        const customerDetails = {
            first_name: customer_name,
            email: customer_email,
            phone: customer_phone,
        };

        const itemDetails = [
            {
                id: program.id,
                name: program.title,
                price: grossAmount,
                quantity: 1,
            },
        ];

        const payload = {
            transaction_details: transactionDetails,
            customer_details: customerDetails,
            item_details: itemDetails,
        };

        const snap = getSnap();
        const transaction = await snap.createTransaction(payload);

        const paymentRecord = {
            order_id: orderId,
            program_id: program.id,
            program_title: program.title,
            customer_name,
            customer_email,
            customer_phone,
            amount: grossAmount,
            status: 'pending',
            midtrans_transaction_id: transaction.transaction_id || null,
            token: transaction.token,
            redirect_url: transaction.redirect_url,
        };

        const insertResult = await queryAsync('INSERT INTO payments SET ?', [paymentRecord]);

        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url,
            order_id: orderId,
            payment_id: insertResult.insertId,
        });
    } catch (error) {
        console.error('Midtrans create transaction error:', error);
        res.status(500).json({ error: 'Gagal membuat transaksi pembayaran' });
    }
});

router.post('/payment/notification', (req, res) => {
    const notificationJson = req.body;
    const orderId = notificationJson.order_id;
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;
    const transactionId = notificationJson.transaction_id;

    let status = 'pending';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'accept' || fraudStatus === undefined) {
            status = 'success';
        } else if (fraudStatus === 'challenge') {
            status = 'challenge';
        } else {
            status = 'failed';
        }
    } else if (transactionStatus === 'pending') {
        status = 'pending';
    } else if (transactionStatus === 'deny') {
        status = 'failed';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
        status = 'cancelled';
    } else {
        status = 'failed';
    }

    db.query(
        'UPDATE payments SET status = ?, midtrans_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
        [status, transactionId, orderId],
        (err) => {
            if (err) {
                console.error('Failed to update payment status:', err);
                return res.status(500).json({ error: 'Gagal memperbarui status pembayaran' });
            }
            res.status(200).json({ message: 'Notification received' });
        }
    );
});

router.get('/payment/status/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const results = await queryAsync('SELECT * FROM payments WHERE order_id = ?', [orderId]);
        if (results.length === 0) return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
