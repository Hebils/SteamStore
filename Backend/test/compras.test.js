const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

test('Compra del carrito en MariaDB', async t => {
    const database = 'gamix_test_' + randomUUID().replaceAll('-', '');
    const local = ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST);
    assert.ok(local, 'Estas pruebas utilizan la instancia local de XAMPP.');
    const dbPort = Number(process.env.DB_PORT) || 3306;
    const admin = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: dbPort === Number(process.env.PORT || 3000) ? 3306 : dbPort,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });
    t.after(() => admin.end());
    await admin.query('CREATE DATABASE ??', [database]);
    try {
        process.env.DB_NAME = database;
        execFileSync(process.execPath, [path.resolve(__dirname, '../scripts/preparar-db.js')]);
        await admin.query('USE ??', [database]);
        const [user] = await admin.execute(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            ['Prueba', 'prueba@example.test', 'cuenta de prueba sin login']
        );
        const [game] = await admin.execute(
            'INSERT INTO juegos (titulo, genero, precio) VALUES (?, ?, ?)',
            ['Prueba', 'Aventura', '12.50']
        );
        const purchases = require('../src/services/purchaseService');
        const pool = require('../src/config/db');
        try {
            await purchases.addGame(user.insertId, game.insertId);

            await t.test('un fallo al guardar el detalle revierte el total y conserva el carrito', async () => {
                await admin.query(`CREATE TRIGGER rechazar_detalle BEFORE INSERT ON compra_detalle
                    FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Fallo de prueba'`);
                try {
                    await assert.rejects(purchases.checkout(user.insertId), { code: 'ER_SIGNAL_EXCEPTION' });
                    assert.equal((await purchases.history(user.insertId)).length, 0);
                    assert.equal((await purchases.getCart(user.insertId)).length, 1);
                } finally {
                    await admin.query('DROP TRIGGER rechazar_detalle');
                }
            });

            await t.test('dos confirmaciones simultáneas producen una sola adquisición', async () => {
                const results = await Promise.allSettled([
                    purchases.checkout(user.insertId), purchases.checkout(user.insertId)
                ]);
                assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
                assert.equal(results.find(r => r.status === 'rejected').reason.status, 409);
                assert.equal((await purchases.getCart(user.insertId)).length, 0);
                await admin.execute('UPDATE juegos SET publicado = 0, precio = 20 WHERE id = ?', [game.insertId]);
                const [order] = await purchases.history(user.insertId);
                assert.equal(order.total, '12.50');
                assert.equal(order.items[0].precio, '12.50');
                assert.equal((await purchases.library(user.insertId))[0].id, game.insertId);
            });
        } finally {
            await pool.end();
        }
    } finally {
        await admin.query('DROP DATABASE ??', [database]);
    }
});
