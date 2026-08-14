require('dotenv').config();
const mysql = require('mysql2');

const connectionPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', 
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_SCHEME || 'db_server',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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