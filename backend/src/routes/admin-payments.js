const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    const { limit, offset, status, program_id } = req.query;
    let query = 'SELECT p.*, pr.title as program_title FROM payments p LEFT JOIN programs pr ON p.program_id = pr.id WHERE 1=1';
    const params = [];

    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (program_id) { query += ' AND p.program_id = ?'; params.push(program_id); }

    query += ' ORDER BY p.created_at DESC';

    const limitNum = parseInt(limit) || 0;
    const offsetNum = parseInt(offset) || 0;

    if (limitNum <= 0) {
        db.query(query, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
        return;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as t`;
    db.query(countQuery, params, (err, countResults) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = countResults[0]?.total || 0;
        db.query(`${query} LIMIT ? OFFSET ?`, [...params, limitNum, offsetNum], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: results, total, offset: offsetNum, limit: limitNum });
        });
    });
});

router.get('/:id', (req, res) => {
    db.query('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
        res.json(results[0]);
    });
});

router.put('/:id', (req, res) => {
    const { status } = req.body;
    const allowed = ['pending', 'success', 'failed', 'challenge', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });

    db.query('UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query('SELECT * FROM payments WHERE id = ?', [req.params.id], (err2, results) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json(results[0]);
        });
    });
});

router.get('/order/:orderId', (req, res) => {
    db.query('SELECT * FROM payments WHERE order_id = ?', [req.params.orderId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Pembayaran tidak ditemukan' });
        res.json(results[0]);
    });
});

module.exports = router;
