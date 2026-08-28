require('dotenv').config();
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

const sslValidate = process.env.DB_SSL_REQUIRED && process.env.DB_SSL_REQUIRED == "true";
const caValidate = sslValidate && fs.existsSync(path.join(__dirname, process.env.DB_SSL_CA_PATH)) && process.env.DB_SSL_CA_PATH && process.env.DB_SSL_CA_PATH != "";

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
    ...(sslValidate ? {
        ssl: {
            ...(caValidate ? { ca: fs.readFileSync(path.join(__dirname, process.env.DB_SSL_CA_PATH)) } : {}),
            rejectUnauthorized: caValidate
        }
    } : {})
});

connectionPool.getConnection((err, connection) => {
    if (err) {
        console.error("Gagal menghubungkan MySQL:", err.message);
        throw err;
    }
    console.log("Berhasil menghubungkan MySQL melalui Connection Pool!");
    connection.release();
});

module.exports = connectionPool;