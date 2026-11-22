const { ApiError } = require('../middleware/errors');

const pool = require('../config/db');

function reviewData(body = {}) {
    const rating = body.calificacion;
    const calificacion = typeof rating === 'string' && /^[1-5]$/.test(rating) ? Number(rating) : rating;
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
        throw new ApiError(400, 'La calificación debe estar entre 1 y 5');
    }
    const comentario = body.comentario;
    if (comentario != null && (typeof comentario !== 'string' || Buffer.byteLength(comentario) > 65535)) {
        throw new ApiError(400, 'El comentario no es válido.');
    }
    return { calificacion, comentario };
}

const obtenerResenas = async (req, res) => {
    const { id } = req.params;

    const [resenas] = await pool.query(
        `SELECT resenas.id, resenas.usuario_id, resenas.juego_id,
                resenas.calificacion, resenas.comentario,
                resenas.fecha_creacion, usuarios.nombre
         FROM resenas
         INNER JOIN usuarios ON resenas.usuario_id = usuarios.id
         WHERE resenas.juego_id = ?
         ORDER BY resenas.fecha_creacion DESC`,
        [id]
    );

    res.json({
        status: 'ok',
        resenas
    });
};

const crearResena = async (req, res) => {
    const { id } = req.params;
    const { calificacion, comentario } = reviewData(req.body);
    const usuario_id = req.usuario.id;


    const [juegos] = await pool.query(
        'SELECT id FROM juegos WHERE id = ?',
        [id]
    );

    if (juegos.length === 0) {
        throw new ApiError(404, 'El videojuego no existe');
    }

    const [resultado] = await pool.query(
        `INSERT INTO resenas (usuario_id, juego_id, calificacion, comentario)
         VALUES (?, ?, ?, ?)`,
        [usuario_id, id, calificacion, comentario || null]
    );

    res.status(201).json({
        status: 'ok',
        message: 'Reseña creada correctamente',
        id: resultado.insertId
    });
};

const actualizarResena = async (req, res) => {
    const { id } = req.params;
    const { calificacion, comentario } = reviewData(req.body);
    const usuario_id = req.usuario.id;


    const [resultado] = await pool.query(
        `UPDATE resenas
         SET calificacion = ?, comentario = ?
         WHERE id = ? AND usuario_id = ?`,
        [calificacion, comentario || null, id, usuario_id]
    );

    if (resultado.affectedRows === 0) {
        throw new ApiError(404, 'Reseña no encontrada o no tienes permiso para modificarla');
    }

    res.json({
        status: 'ok',
        message: 'Reseña actualizada correctamente'
    });
};

const eliminarResena = async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;

    const [resultado] = await pool.query(
        'DELETE FROM resenas WHERE id = ? AND usuario_id = ?',
        [id, usuario_id]
    );

    if (resultado.affectedRows === 0) {
        throw new ApiError(404, 'Reseña no encontrada o no tienes permiso para eliminarla');
    }

    res.json({
        status: 'ok',
        message: 'Reseña eliminada correctamente'
    });
};

module.exports = {
    obtenerResenas,
    crearResena,
    actualizarResena,
    eliminarResena
};
