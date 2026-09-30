const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    try {
        // Obtener el header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'Token no proporcionado'
            });
        }

        // Verificar que tenga formato Bearer
        const partes = authHeader.split(' ');

        if (partes.length !== 2 || partes[0] !== 'Bearer') {
            return res.status(401).json({
                status: 'error',
                message: 'Formato de token inválido'
            });
        }

        const token = partes[1];

        // Verificar token
        const usuario = jwt.verify(
            token,
            process.env.SECRET_KEY
        );

        // Guardar información del usuario en la petición
        req.usuario = usuario;

        next();

    } catch (error) {
        console.error('Error al verificar token:', error);

        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = verificarToken;

//..