const crypto = require('crypto');

const secret = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET || 'cendana-jwt-secret-key';
const key = crypto.scryptSync(secret, 'captcha-salt', 32);

function encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        content: encrypted.toString('base64'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
    };
}

function decrypt(data) {
    const iv = Buffer.from(data.iv, 'hex');
    const tag = Buffer.from(data.tag, 'hex');
    const encrypted = Buffer.from(data.content, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

const store = new Map();

function set(id, text) {
    store.set(id, encrypt(text));
}

function get(id) {
    const data = store.get(id);
    if (!data) return null;
    try {
        return decrypt(data);
    } catch (err) {
        store.delete(id);
        return null;
    }
}

function delete_(id) {
    store.delete(id);
}

function cleanup(now) {
    for (const [id, data] of store) {
        if (now - parseInt(id.slice(0, 13), 36) > 5 * 60 * 1000) {
            store.delete(id);
        }
    }
}

setInterval(() => cleanup(Date.now()), 60 * 1000);

module.exports = { set, get, delete: delete_, cleanup };
