const pool = require('../config/db');
const transaction = require('./transaction');
const { ApiError } = require('../middleware/errors');

const cartQuery = `SELECT j.id, j.titulo, j.precio, j.publicado
    FROM carrito_items ci JOIN juegos j ON j.id = ci.juego_id
    WHERE ci.usuario_id = ? ORDER BY j.id`;

const ownedQuery = `FROM compras c JOIN compra_detalle d ON d.compra_id = c.id
    WHERE c.usuario_id = ? AND d.juego_id IN (?)`;

// Serializar las operaciones de un carrito evita comprar dos veces al hacer doble clic.
function changeCart(userId, work) {
    return transaction(async db => {
        const [[user]] = await db.execute('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [userId]);
        if (!user) throw new ApiError(401, 'La cuenta ya no está disponible.');
        return work(db);
    });
}

async function getCart(userId) {
    const [items] = await pool.execute(cartQuery, [userId]);
    return items;
}

function addGame(userId, gameId) {
    return changeCart(userId, async db => {
        const [[game]] = await db.execute('SELECT id FROM juegos WHERE id = ? AND publicado = 1 LOCK IN SHARE MODE', [gameId]);
        if (!game) throw new ApiError(404, 'Juego no disponible.');
        const [[owned]] = await db.query('SELECT d.id ' + ownedQuery + ' LIMIT 1', [userId, [gameId]]);
        if (owned) throw new ApiError(409, 'El juego ya está en tu biblioteca.');
        await db.execute(`INSERT INTO carrito_items (usuario_id, juego_id) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE juego_id = VALUES(juego_id)`, [userId, gameId]);
    });
}

function removeGame(userId, gameId) {
    return changeCart(userId, db => db.execute(
        'DELETE FROM carrito_items WHERE usuario_id = ? AND juego_id = ?', [userId, gameId]
    ));
}

function checkout(userId) {
    return changeCart(userId, async db => {
        const [items] = await db.execute(cartQuery + ' FOR UPDATE', [userId]);
        if (!items.length) throw new ApiError(409, 'El carrito está vacío.');
        if (items.some(game => !game.publicado)) throw new ApiError(409, 'Retira del carrito los juegos que ya no están disponibles.');
        const [[owned]] = await db.query('SELECT d.id ' + ownedQuery + ' LIMIT 1', [userId, items.map(g => g.id)]);
        if (owned) throw new ApiError(409, 'El carrito contiene juegos que ya tienes.');

        // MariaDB devuelve DECIMAL(10,2) como texto. Sumar centavos conserva el precio exacto.
        const cents = items.reduce((sum, game) => sum + BigInt(game.precio.replace('.', '')), 0n);
        if (cents > 9999999999n) throw new ApiError(400, 'El total supera el límite de una compra.');
        const total = (cents / 100n) + '.' + String(cents % 100n).padStart(2, '0');
        const [purchase] = await db.execute('INSERT INTO compras (usuario_id, total) VALUES (?, ?)', [userId, total]);
        await db.query('INSERT INTO compra_detalle (compra_id, juego_id, precio) VALUES ?', [
            items.map(game => [purchase.insertId, game.id, game.precio])
        ]);
        await db.execute('DELETE FROM carrito_items WHERE usuario_id = ?', [userId]);
        return { id: purchase.insertId, total, items };
    });
}

async function history(userId) {
    const [rows] = await pool.execute(`SELECT c.id, c.fecha_compra, c.total, d.juego_id, d.precio, j.titulo
        FROM compras c LEFT JOIN compra_detalle d ON d.compra_id = c.id
        LEFT JOIN juegos j ON j.id = d.juego_id WHERE c.usuario_id = ?
        ORDER BY c.fecha_compra DESC, c.id DESC, d.id`, [userId]);
    const purchases = new Map();
    for (const row of rows) {
        if (!purchases.has(row.id)) {
            purchases.set(row.id, { id: row.id, fecha_compra: row.fecha_compra, total: row.total, items: [] });
        }
        if (row.juego_id != null) purchases.get(row.id).items.push({ id: row.juego_id, titulo: row.titulo, precio: row.precio });
    }
    return [...purchases.values()];
}

async function library(userId) {
    const [games] = await pool.execute(`SELECT j.id, j.titulo, j.genero, j.publicado, MIN(c.fecha_compra) AS fecha_adquisicion
        FROM compras c JOIN compra_detalle d ON c.id = d.compra_id JOIN juegos j ON j.id = d.juego_id
        WHERE c.usuario_id = ? GROUP BY j.id, j.titulo, j.genero, j.publicado
        ORDER BY fecha_adquisicion DESC, j.id`, [userId]);
    return games;
}

module.exports = { getCart, addGame, removeGame, checkout, history, library };
