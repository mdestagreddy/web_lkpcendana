const HONEYPOT_FIELD = 'hp_confirm';
const HONEYPOT_TOKEN_FIELD = 'hp_token';
const captchaStore = require('../utils/captcha');

function honeypotMiddleware(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT') {
        const body = req.body || {};
        const value = body[HONEYPOT_FIELD];
        if (typeof value === 'string' && value.trim() !== '') {
            return res.status(400).json({ error: 'Permintaan tidak valid.' });
        }

        if (req.url.includes('/login') || req.url.includes('/reviews')) {
            const captchaId = body.captchaId;
            const token = body[HONEYPOT_TOKEN_FIELD];
            if (!captchaId || !token) {
                return res.status(400).json({ error: 'Permintaan tidak valid.' });
            }
            if (!captchaStore.verifyHoneypotToken(captchaId, token)) {
                return res.status(400).json({ error: 'Permintaan tidak valid.' });
            }
        }
    }
    next();
}

module.exports = { honeypotMiddleware, HONEYPOT_FIELD, HONEYPOT_TOKEN_FIELD };
