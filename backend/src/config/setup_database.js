const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

const setupSqlPath = path.join(__dirname, '../database/setup.sql');
const addSqlPath = path.join(__dirname, '../database/add.sql');

function runSqlFile(filePath) {
    return new Promise((resolve, reject) => {
        const sqlQuery = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1', 
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_SCHEME || 'db_server',
            multipleStatements: true
        });
        connection.query(sqlQuery, (err, res) => {
            connection.end();
            if (err) return reject(err);
            console.log(`Sukses menjalankan ${path.basename(filePath)}`);
            resolve(res);
        });
    });
}

async function setupDatabase() {
    try {
        await runSqlFile(setupSqlPath);
        console.log('Semua setup database berhasil');
        return true;
    } catch (err) {
        console.error('Gagal setup database:', err.message);
        return false;
    }
}

async function runAddSql(environment) {
    try {
        console.log(`Menjalankan add.sql untuk environment: ${environment}`);
        await runSqlFile(addSqlPath);
        console.log(`Sukses menjalankan add.sql untuk environment: ${environment}`);
        return true;
    } catch (err) {
        console.error(`Gagal menjalankan add.sql untuk environment ${environment}:`, err.message);
        return false;
    }
}

module.exports = { setupDatabase, runAddSql };

if (require.main === module) {
    const env = process.argv[2] || 'development';
    runAddSql(env).then(success => process.exit(success ? 0 : 1));
}