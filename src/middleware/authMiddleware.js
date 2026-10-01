// Importa la librería jsonwebtoken para verificar
// la validez de los tokens JWT.
const jwt = require('jsonwebtoken');


// =========================================
// MIDDLEWARE DE AUTENTICACIÓN
// =========================================

/**
 * Verifica que la petición contenga un token JWT válido.
 *
 * Este middleware protege las rutas que requieren autenticación.
 *
 * Flujo:
 * 1. Obtiene el encabezado Authorization.
 * 2. Comprueba que exista.
 * 3. Verifica que utilice el formato Bearer.
 * 4. Extrae el token.
 * 5. Verifica el token utilizando la clave secreta.
 * 6. Guarda la información del usuario en req.usuario.
 * 7. Permite continuar con la siguiente función de la ruta.
 *
 * Si el token no existe, tiene un formato incorrecto,
 * es inválido o ha expirado, la petición es rechazada.
 *
/** @param {Object} req - Petición HTTP recibida.
/** @param {Object} res - Respuesta HTTP enviada al cliente.
/** @param {Function} next - Función que permite continuar con
 * la siguiente función o middleware de la ruta.
 */
const verificarToken = (req, res, next) => {

    try {

        // =========================================
        // OBTENER TOKEN
        // =========================================

        // Obtiene el encabezado Authorization enviado
        // por el cliente.
        //
        // Ejemplo:
        // Authorization: Bearer eyJhbGciOiJIUzI1Ni...
        const authHeader = req.headers.authorization;


        // Verifica que la petición haya enviado
        // el encabezado Authorization.
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'Token no proporcionado'
            });
        }


        // =========================================
        // VALIDAR FORMATO DEL TOKEN
        // =========================================

        // Divide el encabezado en dos partes:
        //
        // Bearer
        // TOKEN
        //
        // El formato esperado es:
        // Authorization: Bearer <token>
        const partes = authHeader.split(' ');


        // Comprueba que existan exactamente dos partes
        // y que la primera sea la palabra "Bearer".
        if (partes.length !== 2 || partes[0] !== 'Bearer') {
            return res.status(401).json({
                status: 'error',
                message: 'Formato de token inválido'
            });
        }


        // Obtiene únicamente el token JWT.
        const token = partes[1];


        // =========================================
        // VERIFICAR TOKEN
        // =========================================

        // Verifica que el token haya sido firmado con la
        // clave secreta correspondiente y que no haya expirado.
        //
        // Si el token es válido, jwt.verify() devuelve
        // la información almacenada dentro del token.
        const usuario = jwt.verify(
            token,
            process.env.SECRET_KEY
        );


        // =========================================
        // GUARDAR USUARIO EN LA PETICIÓN
        // =========================================

        // Guarda la información obtenida del JWT dentro
        // del objeto request.
        //
        // Esto permite que los siguientes middlewares
        // y controladores puedan identificar al usuario.
        req.usuario = usuario;


        // Permite que la petición continúe hacia
        // el siguiente middleware o controlador.
        next();


    } catch (error) {

        // Registra el error en la consola del servidor
        // para facilitar su diagnóstico durante el desarrollo.
        console.error('Error al verificar token:', error);


        // Si el token es inválido, está manipulado
        // o ya expiró, se rechaza la petición.
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado'
        });
    }
};


// =========================================
// EXPORTAR MIDDLEWARE
// =========================================

// Exporta el middleware para utilizarlo
// en las rutas que requieren autenticación.
module.exports = verificarToken;