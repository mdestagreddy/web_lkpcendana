const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../database/db');
const { createLimiter } = require('../middleware/rateLimit');
const { honeypotMiddleware } = require('../middleware/honeypot');
const captchaStore = require('../utils/captcha');
const { authMiddleware, JWT_SECRET, getFingerprint } = require('../middleware/auth');
const tokenBlacklist = require('../middleware/tokenBlacklist');
const otplib = require('otplib');

const captchaRateLimiter = createLimiter(10, 60 * 1000);
const loginRateLimiter = createLimiter(5, 60 * 1000);

router.get('/captcha', captchaRateLimiter, (req, res) => {
    const svgCaptcha = require('svg-captcha');
    const captchaId = captchaStore.createSignedId();
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
    captchaStore.set(captchaId, captcha.text.toLowerCase(), req);
    const honeypotToken = captchaStore.createHoneypotToken(captchaId);
    res.json({
        captchaId,
        svg: captcha.data,
        hpToken: honeypotToken,
    });
});

router.post('/login', loginRateLimiter, honeypotMiddleware, (req, res) => {
    const { email, password, captchaId, captchaText } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!captchaId || !captchaText) {
        return res.status(400).json({ error: 'Captcha wajib diisi' });
    }

    const expected = captchaStore.get(captchaId, req);
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

            if (user.twofa_enabled) {
                const tempToken = jwt.sign(
                    { id: user.id, email: user.email, role: user.role, token_version: user.token_version || 0, step: '2fa', fingerprint: getFingerprint(req) },
                    JWT_SECRET,
                    { expiresIn: '5m' }
                );
                return res.json({ requiresTwoFactor: true, tempToken });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, token_version: user.token_version || 0, fingerprint: getFingerprint(req) },
                JWT_SECRET,
                { expiresIn: '24h' }
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

router.post('/2fa/setup', authMiddleware, (req, res) => {
    const secret = otplib.generateSecret();
    db.query('UPDATE users SET twofa_secret = ? WHERE id = ?', [secret, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ secret, otpauth: otplib.generateURI({ label: req.user.email, issuer: 'LKP Cendana', secret }) });
    });
});

router.post('/2fa/enable', authMiddleware, (req, res) => {
    const { code } = req.body;
    db.query('SELECT twofa_secret FROM users WHERE id = ? LIMIT 1', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const secret = results[0]?.twofa_secret;
        if (!secret || !otplib.verify({ token: code, secret })) {
            return res.status(400).json({ error: 'Kode 2FA salah' });
        }
        db.query('UPDATE users SET twofa_enabled = 1 WHERE id = ?', [req.user.id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: '2FA berhasil diaktifkan' });
        });
    });
});

router.post('/2fa/verify', (req, res) => {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
        return res.status(400).json({ error: 'tempToken dan kode 2FA wajib diisi' });
    }

    try {
        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (!decoded || decoded.step !== '2fa') {
            return res.status(401).json({ error: 'Sesi 2FA tidak valid' });
        }

        db.query('SELECT twofa_secret FROM users WHERE id = ? LIMIT 1', [decoded.id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const secret = results[0]?.twofa_secret;
            if (!secret || !otplib.verify({ token: code, secret })) {
                return res.status(400).json({ error: 'Kode 2FA salah' });
            }

            const token = jwt.sign(
                { id: decoded.id, email: decoded.email, role: decoded.role, token_version: decoded.token_version || 0, fingerprint: decoded.fingerprint },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token, user: { id: decoded.id, email: decoded.email, role: decoded.role } });
        });
    } catch {
        return res.status(401).json({ error: 'Sesi 2FA tidak valid' });
    }
});

router.post('/logout', authMiddleware, (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        tokenBlacklist.add(token, req);
    }
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
