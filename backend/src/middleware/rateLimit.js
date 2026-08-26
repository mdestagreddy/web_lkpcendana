const rateLimiters = new Map();

function createLimiter(maxRequests, windowMs) {
    const limiter = new Map();

    function getClientKey(req) {
        return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    }

    function cleanup() {
        const now = Date.now();
        for (const [key, data] of limiter) {
            if (now - data.windowStart > windowMs) {
                limiter.delete(key);
            }
        }
    }

    setInterval(cleanup, windowMs);

    return function rateLimit(req, res, next) {
        const key = getClientKey(req);
        const now = Date.now();
        const record = limiter.get(key);

        if (!record || now - record.windowStart > windowMs) {
            limiter.set(key, { count: 1, windowStart: now });
            return next();
        }

        if (record.count >= maxRequests) {
            return res.status(429).json({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' });
        }

        record.count += 1;
        next();
    };
}

module.exports = { createLimiter };
