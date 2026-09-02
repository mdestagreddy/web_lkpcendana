const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { getSnap } = require('../utils/midtrans');

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
    const { program_id, customer_name, customer_email, customer_phone, amount, redirect_url } = req.body;

    if (!program_id || !customer_name || !customer_email || !customer_phone || !amount) {
        return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    try {
        const programs = await queryAsync('SELECT * FROM programs WHERE id = ? AND is_active = 1', [program_id]);
        if (programs.length === 0) return res.status(404).json({ error: 'Program tidak ditemukan' });

        const program = programs[0];
        const baseUrl = getBaseUrl(req);
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
            callbacks: {
                finish: redirect_url || `${baseUrl}/registration`,
            },
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

router.get('/payment/finish', (req, res) => {
    const { order_id, status_code, transaction_status } = req.query;
    res.redirect(`/registration?payment=finish&order_id=${encodeURIComponent(order_id || '')}&status_code=${encodeURIComponent(status_code || '')}&transaction_status=${encodeURIComponent(transaction_status || '')}`);
});

router.get('/payment/unfinish', (req, res) => {
    const { order_id, status_code, transaction_status } = req.query;
    res.redirect(`/registration?payment=unfinish&order_id=${encodeURIComponent(order_id || '')}&status_code=${encodeURIComponent(status_code || '')}&transaction_status=${encodeURIComponent(transaction_status || '')}`);
});

router.get('/payment/error', (req, res) => {
    const { order_id, status_code, transaction_status } = req.query;
    res.redirect(`/registration?payment=error&order_id=${encodeURIComponent(order_id || '')}&status_code=${encodeURIComponent(status_code || '')}&transaction_status=${encodeURIComponent(transaction_status || '')}`);
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

router.get('/payment/sync/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const results = await queryAsync('SELECT * FROM payments WHERE order_id = ?', [orderId]);
        if (results.length === 0) return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });

        const payment = results[0];
        const snap = getSnap();
        const transaction = await snap.transaction.status(orderId);

        let status = 'pending';
        const transactionStatus = transaction.transaction_status;
        const fraudStatus = transaction.fraud_status;

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

        await queryAsync(
            'UPDATE payments SET status = ?, midtrans_transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?',
            [status, transaction.transaction_id, orderId]
        );

        const updated = await queryAsync('SELECT * FROM payments WHERE order_id = ?', [orderId]);
        res.json({ data: updated[0], midtrans: transaction });
    } catch (err) {
        console.error('Midtrans sync error:', err);
        res.status(500).json({ error: 'Gagal sinkronisasi pembayaran' });
    }
});

router.post('/payment/recurring-notification', (req, res) => {
    const notificationJson = req.body;
    console.log('Recurring payment notification:', notificationJson);
    res.status(200).json({ message: 'Recurring notification received' });
});

router.post('/payment/gopay-linking-notification', (req, res) => {
    const notificationJson = req.body;
    console.log('GoPay linking notification:', notificationJson);
    res.status(200).json({ message: 'GoPay linking notification received' });
});

module.exports = router;
