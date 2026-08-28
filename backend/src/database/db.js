require('dotenv').config();
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const hasCaPath = process.env.DB_SSL_CA_PATH && process.env.DB_SSL_CA_PATH.trim() !== "";
const caFilePath = hasCaPath ? path.join(__dirname, process.env.DB_SSL_CA_PATH) : null;
const isVerifyCA = caFilePath && fs.existsSync(caFilePath);
const isSSLRequired = (process.env.DB_SSL_REQUIRED === "true") || isVerifyCA;

const connectionPool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1', 
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_SCHEME || 'db_server',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(isSSLRequired ? {
        ssl: {
            ...(isVerifyCA ? { ca: fs.readFileSync(caFilePath) } : {}),
            rejectUnauthorized: isVerifyCA
        }
    } : {})
});

connectionPool.getConnection((err, connection) => {
    if (err) {
        console.error("Gagal menghubungkan MySQL:", err.message);
        throw err;
    }
    const mode = isVerifyCA ? "VERIFY_CA" : (isSSLRequired ? "REQUIRED" : "DISABLED");
    console.log(`Berhasil menghubungkan MySQL melalui Connection Pool! (SSL Mode: ${mode})`);
    connection.release();
});

module.exports = connectionPool;