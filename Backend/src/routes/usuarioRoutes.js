
const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    iniciarSesion,
    actualizarPerfil
} = require('../controllers/usuarioController');

const verificarToken = require('../middleware/authMiddleware');
const verificarRol = require('../middleware/rolMiddleware');

router.post('/registro', registrarUsuario);

router.post('/login', iniciarSesion);

router.get(['/perfil', '/me'], verificarToken, (req, res) => {
    res.json({
        status: 'ok',
        message: 'Acceso autorizado',
        usuario: req.usuario
    });
});

router.put('/me', verificarToken, actualizarPerfil);

router.get('/admin', verificarToken, verificarRol('admin'), (req, res) => {
    res.json({
        status: 'ok',
        message: 'Acceso autorizado para administrador',
        usuario: req.usuario
    });
});

module.exports = router;
