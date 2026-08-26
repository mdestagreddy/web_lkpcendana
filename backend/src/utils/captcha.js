const crypto = require('crypto');

const secret = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'cendana-jwt-secret-key';
const ttlMs = 5 * 60 * 1000;

function createSignedId() {
    const timestamp = Date.now().toString();
    const hmac = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
    return `${hmac}.${timestamp}`;
}

function verifySignedId(id) {
    const [receivedHmac, timestampStr] = String(id || '').split('.');
    if (!receivedHmac || !timestampStr) return null;
    const timestamp = parseInt(timestampStr, 10);
    if (!Number.isFinite(timestamp)) return null;
    if (Date.now() - timestamp > ttlMs) return null;
    const expectedHmac = crypto.createHmac('sha256', secret).update(timestampStr).digest('hex');
    try {
        const valid = crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expectedHmac));
        return valid ? timestampStr : null;
    } catch {
        return null;
    }
}

const store = new Map();

function getClientFingerprint(req) {
    const ip = (req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '').toString();
    const ua = String(req.headers?.['user-agent'] || '').slice(0, 200);
    return `${ip}|${ua}`;
}

function set(id, text, req) {
    const valid = verifySignedId(id);
    if (!valid) return false;
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(secret, 'captcha-salt', 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    store.set(id, {
        content: encrypted.toString('base64'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        fingerprint: getClientFingerprint(req),
    });
    return true;
}

function get(id, req) {
    const data = store.get(id);
    if (!data) return null;
    const valid = verifySignedId(id);
    if (!valid) {
        store.delete(id);
        return null;
    }
    const fingerprint = getClientFingerprint(req);
    if (data.fingerprint && data.fingerprint !== fingerprint) {
        store.delete(id);
        return null;
    }
    try {
        const iv = Buffer.from(data.iv, 'hex');
        const tag = Buffer.from(data.tag, 'hex');
        const encrypted = Buffer.from(data.content, 'base64');
        const key = crypto.scryptSync(secret, 'captcha-salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (err) {
        store.delete(id);
        return null;
    }
}

function delete_(id) {
    store.delete(id);
}

function cleanup(now) {
    for (const id of store.keys()) {
        const ts = id.split('.')[1];
        if (!ts || now - parseInt(ts, 10) > ttlMs) {
            store.delete(id);
        }
    }
}

setInterval(() => cleanup(Date.now()), 60 * 1000);

module.exports = { createSignedId, verifySignedId, set, get, delete: delete_, cleanup };
