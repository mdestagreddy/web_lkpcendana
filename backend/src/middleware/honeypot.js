const HONEYPOT_FIELD = 'hp_confirm';

function honeypotMiddleware(req, res, next) {
    if (req.method === 'POST' || req.method === 'PUT') {
        const body = req.body || {};
        const value = body[HONEYPOT_FIELD];

        if (typeof value === 'string' && value.trim() !== '') {
            return res.status(400).json({ error: 'Permintaan tidak valid.' });
        }
    }

    next();
}

module.exports = { honeypotMiddleware, HONEYPOT_FIELD };
