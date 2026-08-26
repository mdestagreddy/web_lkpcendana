const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cendana-jwt-secret-key';
const captchaStore = new Map();

router.get('/captcha', (req, res) => {
    const svgCaptcha = require('svg-captcha');
    const captchaId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 3,
        color: true,
        background: '#f8f9fa',
    });
    captchaStore.set(captchaId, captcha.text.toLowerCase());
    res.json({
        captchaId,
        svg: captcha.data,
    });
});

router.post('/login', (req, res) => {
    const { email, password, captchaId, captchaText } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
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

    db.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const user = results[0];

            try {
                const valid = await bcrypt.compare(password, user.password);
                if (!valid) {
                    return res.status(401).json({ error: 'Invalid email or password' });
                }
            } catch (compareErr) {
                return res.status(500).json({ error: 'Authentication error' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                },
            });
        }
    );
});

module.exports = router;
