const path = require('node:path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });
const local = ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST);
const httpPort = Number(process.env.PORT) || 3000;
const dbPort = Number(process.env.DB_PORT) || 3306;

module.exports = mysql.createPool({
    host: process.env.DB_HOST,
    port: local && dbPort === httpPort ? 3306 : dbPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
