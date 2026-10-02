/**
/**@description Middleware de autorización basado en roles. Restringe el acceso
 * a una ruta según el rol del usuario autenticado.
 */

/**
 * Fábrica de middleware que verifica si el usuario autenticado tiene
 * alguno de los roles permitidos para acceder a una ruta.
 *
 * Debe ejecutarse DESPUÉS del middleware de autenticación (por ejemplo, el
 * que valida el JWT), ya que depende de que `req.usuario` ya esté definido.
 *
/**function verificarRol
/**param {...string} rolesPermitidos - Uno o más roles con acceso a la ruta
 *   (por ejemplo: 'admin', 'editor'). *
 */
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {

        // Si no hay usuario en la petición, el middleware de autenticación
        // no se ejecutó o el token no fue válido.
        if (!req.usuario) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }

        // El usuario está autenticado, pero su rol no está en la lista permitida.
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para acceder a este recurso'
            });
        }

        // El usuario tiene un rol válido: continúa al siguiente middleware o controlador.
        next();
    };
};

module.exports = verificarRol;