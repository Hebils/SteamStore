const { ApiError } = require('./errors');

module.exports = (...roles) => (req, res, next) => {
    if (!req.usuario) throw new ApiError(401, 'Usuario no autenticado');
    if (!roles.includes(req.usuario.rol)) throw new ApiError(403, 'No tienes permisos para acceder a este recurso');
    next();
};
