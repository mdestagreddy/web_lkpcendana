const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcrypt');
const { createLimiter } = require('../middleware/rateLimit');
const { honeypotMiddleware } = require('../middleware/honeypot');

const captchaStore = new Map();

const captchaRateLimiter = createLimiter(10, 60 * 1000);
const reviewRateLimiter = createLimiter(3, 60 * 1000);

router.get('/captcha', captchaRateLimiter, (req, res) => {
    const svgCaptcha = require('svg-captcha');
    const captchaId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const captcha = svgCaptcha.create({
        size: 6,
        noise: 5,
        color: true,
        background: '#f8f9fa',
        width: 220,
        height: 80,
        fontSize: 48,
        ignoreChars: '0oO1lI',
        lineWidth: 2,
    });
    captchaStore.set(captchaId, captcha.text.toLowerCase());
    res.json({
        captchaId,
        svg: captcha.data,
    });
});

router.get('/', (req, res) => {
    const query = 'SELECT * FROM reviews WHERE is_active = 1 ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/', reviewRateLimiter, honeypotMiddleware, (req, res) => {
    const { nama, email, rating, isi, images, captchaId, captchaText } = req.body;
    console.log('[Review] Create request:', { nama, email, rating, images, captchaId });

    if (!nama || !isi) {
        return res.status(400).json({ error: 'Nama dan isi ulasan wajib diisi' });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        return res.status(400).json({ error: 'Rating harus antara 1 sampai 5' });
    }

    if (!captchaId || !captchaText) {
        return res.status(400).json({ error: 'Captcha wajib diisi' });
    }

    const expected = captchaStore.get(captchaId);
    if (!expected) {
        return res.status(400).json({ error: 'Captcha expired, silakan muat ulang' });
    }

    if (String(captchaText).toLowerCase().trim() !== expected) {
        captchaStore.delete(captchaId);
        return res.status(400).json({ error: 'Kode captcha salah, silakan coba lagi' });
    }

    captchaStore.delete(captchaId);

    let imagesJson = null;
    if (images && Array.isArray(images)) {
        imagesJson = JSON.stringify(images.filter(url => typeof url === 'string' && url.trim()));
    }

    db.query(
        'INSERT INTO reviews (nama, email, rating, isi, images, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [nama, email || null, rating || 5, isi, imagesJson, 0],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id: result.insertId,
                message: 'Ulasan berhasil dikirim dan menunggu persetujuan admin.',
            });
        }
    );
});

module.exports = router;
