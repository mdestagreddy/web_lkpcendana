const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

function sendPaginated(req, res, baseQuery, params = []) {
    const limit = parseInt(req.query.limit) || 0;
    const offset = parseInt(req.query.offset) || 0;

    if (limit <= 0) {
        db.query(baseQuery, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
        return;
    }

    const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as t`;
    db.query(countQuery, params, (err, countResults) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = countResults[0]?.total || 0;
        db.query(`${baseQuery} LIMIT ? OFFSET ?`, [...params, limit, offset], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ data: results, total, offset, limit });
        });
    });
}

router.use(authMiddleware);

router.get('/reviews', (req, res) => {
    const { is_active } = req.query;
    let query = 'SELECT * FROM reviews';
    const params = [];
    if (is_active !== undefined) {
        query += ' WHERE is_active = ?';
        params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }
    query += ' ORDER BY created_at DESC';
    sendPaginated(req, res, query, params);
});

router.post('/reviews', (req, res) => {
    const { nama, email, rating, isi, images, is_active, created_at } = req.body;
    if (!nama || !isi) return res.status(400).json({ error: 'nama and isi are required' });
    let imagesJson = null;
    if (images && Array.isArray(images)) {
        imagesJson = JSON.stringify(images.filter(url => typeof url === 'string' && url.trim()));
    }
    db.query(
        'INSERT INTO reviews (nama, email, rating, isi, images, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nama, email || null, rating || 5, isi, imagesJson, is_active !== false ? 1 : 0, created_at || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: result.insertId, message: 'Review created successfully' });
        }
    );
});

router.put('/reviews/:id', (req, res) => {
    const { nama, email, rating, isi, images, is_active, created_at } = req.body;
    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    let imagesJson = null;
    if (images && Array.isArray(images)) {
        imagesJson = JSON.stringify(images.filter(url => typeof url === 'string' && url.trim()));
    }
    db.query(
        'UPDATE reviews SET nama = ?, email = ?, rating = ?, isi = ?, images = ?, is_active = ?, created_at = ? WHERE id = ?',
        [nama || null, email || null, rating || 5, isi || null, imagesJson, is_active !== false ? 1 : 0, created_at || null, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Review updated successfully' });
        }
    );
});

router.delete('/reviews/:id', (req, res) => {
    db.query('DELETE FROM reviews WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Review deleted successfully' });
    });
});

module.exports = router;
