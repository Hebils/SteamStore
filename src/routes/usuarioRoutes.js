const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    iniciarSesion
} = require('../controllers/usuarioController');

const verificarToken = require('../middleware/authMiddleware');

router.post('/registro', registrarUsuario);

router.post('/login', iniciarSesion);

//RUTA PROTEGIDA
router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        status: 'ok',
        message: 'Acceso Autorizado',
        usuario: req.usuario
    });
});

module.exports = router;