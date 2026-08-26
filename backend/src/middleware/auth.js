const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'cendana-jwt-secret-key';

function getFingerprint(req) {
    const ip = (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '').toString();
    const ua = String(req.headers?.['user-agent'] || '').slice(0, 200);
    return `${ip}|${ua}`;
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const fp = getFingerprint(req);
        if (decoded.fingerprint && decoded.fingerprint !== fp) {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }

        if (decoded.id) {
            db.query('SELECT token_version FROM users WHERE id = ? LIMIT 1', [decoded.id], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error.' });
                }
                const currentVersion = results[0] ? (results[0].token_version || 0) : 0;
                if (currentVersion !== decoded.token_version) {
                    return res.status(401).json({ error: 'Invalid or expired token.' });
                }
                req.user = decoded;
                next();
            });
            return;
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = { authMiddleware, JWT_SECRET, getFingerprint };
