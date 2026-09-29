const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    iniciarSesion
} = require('../controllers/usuarioController');

const verificarToken = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/rolMiddleware');

router.post('/registro', registrarUsuario);

router.post('/login', iniciarSesion);

router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        status: 'ok',
        message: 'Acceso autorizado',
        usuario: req.usuario
    });
});

router.get('/admin', verificarToken, verificarRol('admin'), (req, res) => {
    res.json({
        status: 'ok',
        message: 'Acceso autorizado para administrador',
        usuario: req.usuario
    });
});

module.exports = router;