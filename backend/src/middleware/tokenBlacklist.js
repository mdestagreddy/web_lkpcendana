const store = new Map();

function add(token, req) {
    const exp = getRemainingMs(req);
    store.set(token, Date.now() + exp);
}

function has(token, req) {
    const exp = store.get(token);
    if (!exp) return false;
    if (Date.now() > exp) {
        store.delete(token);
        return false;
    }
    return true;
}

function getRemainingMs(req) {
    const auth = req.headers.authorization || '';
    const match = auth.match(/^Bearer\s+(.+)$/);
    if (!match) return 15 * 60 * 1000;
    try {
        const decoded = require('jsonwebtoken').decode(match[1], { complete: true });
        if (decoded && decoded.payload && decoded.payload.exp) {
            const remaining = decoded.payload.exp * 1000 - Date.now();
            if (remaining > 0) return remaining;
        }
    } catch {
        // ignore
    }
    return 15 * 60 * 1000;
}

function cleanup() {
    const now = Date.now();
    for (const [token, exp] of store) {
        if (now > exp) {
            store.delete(token);
        }
    }
}

setInterval(cleanup, 60 * 1000);

module.exports = { add, has, cleanup };
