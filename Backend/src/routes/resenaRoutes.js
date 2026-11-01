
const express = require('express');
const router = express.Router();

const {
    obtenerResenas,
    crearResena,
    actualizarResena,
    eliminarResena
} = require('../controllers/resenaController');

const verificarToken = require('../middleware/authMiddleware');

// Consultar reseñas de un videojuego
router.get('/juegos/:id/resenas', obtenerResenas);

// Crear una reseña (requiere iniciar sesión)
router.post('/juegos/:id/resenas', verificarToken, crearResena);

// Modificar una reseña (requiere iniciar sesión)
router.put('/resenas/:id', verificarToken, actualizarResena);

// Eliminar una reseña (requiere iniciar sesión)
router.delete('/resenas/:id', verificarToken, eliminarResena);

module.exports = router;
