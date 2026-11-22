const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../src/config/db');

async function applyFile(filename) {
    const sql = await fs.readFile(path.join(__dirname, '../sql', filename), 'utf8');
    // Los scripts versionados contienen sentencias DDL/DML simples, sin procedimientos.
    const statements = sql.replace(/^\s*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) await pool.query(statement);
    console.log('Aplicado:', filename);
}

async function main() {
    for (const filename of ['000_base.sql', '001_compras.sql', '002_imagenes.sql']) {
        await applyFile(filename);
    }
    if (process.argv.includes('--demo')) await applyFile('demo.sql');
}

main().catch(error => {
    console.error('No se pudo preparar MariaDB:', error.code || error.name);
    process.exitCode = 1;
}).finally(() => pool.end());
