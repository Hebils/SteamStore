const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para acceder a este recurso'
            });
        }

        next();
    };
};

module.exports = verificarRol;