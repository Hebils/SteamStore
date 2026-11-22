const router = require('express').Router();
const pool = require('../config/db');
const verificarToken = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/rolMiddleware');
router.param('id', require('../middleware/validation').validateId);
const { ApiError } = require('../middleware/errors');

const gameFields = `id, titulo, descripcion, genero, precio,
    desarrollador, fecha_lanzamiento, fecha_creacion`;

function validateGameData(body = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Envía los datos del juego en formato JSON.' };
    }
    if (['descripcion', 'desarrollador'].some(key => body[key] != null && typeof body[key] !== 'string')) {
        return { error: 'La descripción y el desarrollador deben ser texto.' };
    }
    if (Buffer.byteLength(body.descripcion || '') > 65535) return { error: 'La descripción es demasiado larga.' };
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const genero = typeof body.genero === 'string' ? body.genero.trim() : '';
    const desarrollador = typeof body.desarrollador === 'string' ? body.desarrollador.trim() : '';
    const precio = Number(body.precio);
    const fecha = body.fecha_lanzamiento === '' ? null : body.fecha_lanzamiento ?? null;

    if (!titulo || titulo.length > 150) return { error: 'El título es obligatorio y debe tener máximo 150 caracteres.' };
    if (!genero || genero.length > 50) return { error: 'El género es obligatorio y debe tener máximo 50 caracteres.' };
    if (!['string', 'number'].includes(typeof body.precio) || !/^\d+(\.\d{1,2})?$/.test(String(body.precio)) || precio > 99999999.99) return { error: 'El precio debe ser un número válido mayor o igual a cero.' };
    if (desarrollador.length > 150) return { error: 'El desarrollador debe tener máximo 150 caracteres.' };
    if (fecha !== null && (typeof fecha !== 'string' || fecha < '1000-01-01' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha)) {
        return { error: 'La fecha de lanzamiento no es válida.' };
    }

    return {
        data: {
            titulo,
            descripcion: descripcion || null,
            genero,
            precio,
            desarrollador: desarrollador || null,
            fecha_lanzamiento: fecha
        }
    };
}

router.get('/', async (req, res) => {
    const [games] = await pool.query(`SELECT ${gameFields} FROM juegos ORDER BY fecha_creacion DESC, id DESC`);
    res.json({ games });
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);

    const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [id]);
    if (!games.length) throw new ApiError(404, 'Juego no encontrado.');
    res.json({ game: games[0] });
});

router.post('/', verificarToken, verificarRol('admin'), async (req, res) => {
    const { data, error } = validateGameData(req.body);
    if (error) throw new ApiError(400, error);

    const [result] = await pool.query(
        `INSERT INTO juegos (titulo, descripcion, genero, precio, desarrollador, fecha_lanzamiento)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.titulo, data.descripcion, data.genero, data.precio, data.desarrollador, data.fecha_lanzamiento]
    );
    const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [result.insertId]);
    res.status(201).json({ status: 'ok', game: games[0] });
});

router.put('/:id', verificarToken, verificarRol('admin'), async (req, res) => {
    const id = Number(req.params.id);
    const { data, error } = validateGameData(req.body);
    if (error) throw new ApiError(400, error);

    const [result] = await pool.query(
        `UPDATE juegos
         SET titulo = ?, descripcion = ?, genero = ?, precio = ?, desarrollador = ?, fecha_lanzamiento = ?
         WHERE id = ?`,
        [data.titulo, data.descripcion, data.genero, data.precio, data.desarrollador, data.fecha_lanzamiento, id]
    );
    if (!result.affectedRows) {
        const [existing] = await pool.query('SELECT id FROM juegos WHERE id = ?', [id]);
        if (!existing.length) throw new ApiError(404, 'Juego no encontrado.');
    }
    const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [id]);
    res.json({ status: 'ok', game: games[0] });
});

router.delete('/:id', verificarToken, verificarRol('admin'), async (req, res) => {
    const id = Number(req.params.id);

    const [result] = await pool.query('DELETE FROM juegos WHERE id = ?', [id]);
    if (!result.affectedRows) throw new ApiError(404, 'Juego no encontrado.');
    res.json({ status: 'ok', message: 'Juego eliminado correctamente.' });
});


module.exports = router;
