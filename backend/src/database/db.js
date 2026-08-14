require('dotenv').config();
const mysql = require('mysql2');

const connectionPool = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_SCHEME || 'db_server',
    multipleStatements: true
});

connectionPool.connect(err => {
    if (err) throw err;
    console.log("Berhasil menghubungkan MySQL");
});

module.exports = connectionPool;