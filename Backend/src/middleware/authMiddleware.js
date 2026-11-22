const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('./errors');

module.exports = async function verificarToken(req, res, next) {
    const match = /^Bearer (\S+)$/.exec(req.get('Authorization') || '');
    if (!match) throw new ApiError(401, 'Se requiere un token Bearer.');
    let payload;
    try {
        payload = jwt.verify(match[1], process.env.SECRET_KEY, { algorithms: ['HS256'] });
    } catch (error) {
        if (!(error instanceof jwt.JsonWebTokenError)) throw error;
        throw new ApiError(401, 'Token inválido o expirado');
    }
    const [[usuario]] = await pool.execute(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = ?', [payload.id]
    );
    if (!usuario) throw new ApiError(401, 'La cuenta ya no está disponible.');
    req.usuario = usuario;
    next();
};
