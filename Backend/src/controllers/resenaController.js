
const pool = require('../config/db');

// =========================================
// CONSULTAR RESEÑAS DE UN VIDEOJUEGO
// =========================================

const obtenerResenas = async (req, res) => {
    try {
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

    } catch (error) {
        console.error('Error al consultar reseñas:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al consultar las reseñas'
        });
    }
};


// =========================================
// CREAR UNA RESEÑA
// =========================================

const crearResena = async (req, res) => {
    try {
        const { id } = req.params;
        const { calificacion, comentario } = req.body;
        const usuario_id = req.usuario.id;

        if (!calificacion || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                status: 'error',
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        const [juegos] = await pool.query(
            'SELECT id FROM juegos WHERE id = ?',
            [id]
        );

        if (juegos.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'El videojuego no existe'
            });
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

    } catch (error) {
        console.error('Error al crear reseña:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la reseña'
        });
    }
};


// =========================================
// MODIFICAR UNA RESEÑA
// =========================================

const actualizarResena = async (req, res) => {
    try {
        const { id } = req.params;
        const { calificacion, comentario } = req.body;
        const usuario_id = req.usuario.id;

        if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                status: 'error',
                message: 'La calificación debe estar entre 1 y 5'
            });
        }

        const [resultado] = await pool.query(
            `UPDATE resenas
             SET calificacion = ?, comentario = ?
             WHERE id = ? AND usuario_id = ?`,
            [calificacion, comentario || null, id, usuario_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Reseña no encontrada o no tienes permiso para modificarla'
            });
        }

        res.json({
            status: 'ok',
            message: 'Reseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar reseña:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar la reseña'
        });
    }
};


// =========================================
// ELIMINAR UNA RESEÑA
// =========================================

const eliminarResena = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        const [resultado] = await pool.query(
            'DELETE FROM resenas WHERE id = ? AND usuario_id = ?',
            [id, usuario_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Reseña no encontrada o no tienes permiso para eliminarla'
            });
        }

        res.json({
            status: 'ok',
            message: 'Reseña eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al eliminar la reseña'
        });
    }
};


module.exports = {
    obtenerResenas,
    crearResena,
    actualizarResena,
    eliminarResena
};
