require('dotenv').config();
const mysql = require('mysql2');
const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_SCHEME
});
conn.query('SELECT key_name, value, LENGTH(value) as val_len FROM site_settings WHERE key_name IN ("header_image", "logo_image")', (err, results) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(results, null, 2));
    conn.end();
});
