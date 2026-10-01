// Importa el pool de conexiones utilizado para acceder a MySQL.
const pool = require('../config/db');

// Librería utilizada para generar y comparar hashes de contraseñas.
const bcrypt = require('bcrypt');

// Librería utilizada para generar y verificar tokens JWT.
const jwt = require('jsonwebtoken');


// =========================================
// REGISTRO DE USUARIO
// =========================================

/**
 * Registra un nuevo usuario en la plataforma.
 *
 * Flujo:
 * 1. Recibe nombre, email y contraseña.
 * 2. Valida que los datos obligatorios estén presentes.
 * 3. Comprueba que el email no esté registrado.
 * 4. Genera un hash seguro de la contraseña.
 * 5. Guarda el usuario en la base de datos.
 * 6. Devuelve los datos básicos del usuario creado.
 *
 /**@param {Object} req - Petición HTTP recibida.
 /**@param {Object} res - Respuesta HTTP enviada al cliente.
 */
const registrarUsuario = async (req, res) => {
    try {

        // Obtiene los datos enviados por el cliente en el cuerpo
        // de la petición HTTP.
        const { nombre, email, password } = req.body;


        // =========================================
        // VALIDACIÓN DE DATOS
        // =========================================

        // Verifica que todos los campos obligatorios hayan sido enviados.
        if (!nombre || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Nombre, email y contraseña son obligatorios'
            });
        }


        // =========================================
        // VERIFICACIÓN DE EMAIL
        // =========================================

        // Consulta la base de datos para determinar si ya existe
        // un usuario registrado con el email proporcionado.
        const [usuarios] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        // Si la consulta devuelve algún registro, significa que
        // el correo electrónico ya está registrado.
        if (usuarios.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'El correo electrónico ya está registrado'
            });
        }


        // =========================================
        // PROTECCIÓN DE LA CONTRASEÑA
        // =========================================

        // Genera un hash de la contraseña utilizando bcrypt.
        //
        // El número 10 corresponde al costo utilizado por bcrypt
        // para realizar el proceso de hashing.
        const passwordHash = await bcrypt.hash(password, 10);


        // =========================================
        // CREACIÓN DEL USUARIO
        // =========================================

        // Inserta el nuevo usuario en la tabla usuarios.
        //
        // Los signos ? representan parámetros que serán enviados
        // por separado para evitar construir directamente la
        // consulta SQL con datos proporcionados por el usuario.
        const [resultado] = await pool.query(
            `INSERT INTO usuarios (nombre, email, password)
             VALUES (?, ?, ?)`,
            [nombre, email, passwordHash]
        );


        // =========================================
        // RESPUESTA
        // =========================================

        // Devuelve código HTTP 201 indicando que el recurso
        // usuario fue creado correctamente.
        //
        // No se devuelve la contraseña ni su hash al cliente.
        res.status(201).json({
            status: 'ok',
            message: 'Usuario registrado correctamente',
            usuario: {
                id: resultado.insertId,
                nombre,
                email
            }
        });

    } catch (error) {

        // Registra el error en la consola del servidor para facilitar
        // el diagnóstico durante el desarrollo.
        console.error('Error al registrar usuario:', error);

        // Devuelve una respuesta genérica al cliente sin exponer
        // detalles internos del servidor.
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
};


// =========================================
// INICIO DE SESIÓN
// =========================================

/**
 * Autentica un usuario mediante email y contraseña.
 *
 * Flujo:
 * 1. Recibe email y contraseña.
 * 2. Busca el usuario en MySQL.
 * 3. Compara la contraseña recibida con el hash almacenado.
 * 4. Genera un token JWT si las credenciales son válidas.
 * 5. Devuelve el token y los datos básicos del usuario.
 *
/**@param {Object} req - Petición HTTP recibida.
/** @param {Object} res - Respuesta HTTP enviada al cliente.
 */
const iniciarSesion = async (req, res) => {
    try {

        // Obtiene las credenciales enviadas por el cliente.
        const { email, password } = req.body;


        // =========================================
        // VALIDACIÓN DE DATOS
        // =========================================

        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email y contraseña son obligatorios'
            });
        }


        // =========================================
        // BÚSQUEDA DEL USUARIO
        // =========================================

        // Busca el usuario mediante su correo electrónico.
        //
        // También obtiene el rol porque será incluido posteriormente
        // dentro del token JWT.
        const [usuarios] = await pool.query(
            `SELECT id, nombre, email, password, rol
             FROM usuarios
             WHERE email = ?`,
            [email]
        );


        // Si no existe ningún usuario con ese email,
        // se rechaza la autenticación.
        if (usuarios.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }


        // Obtiene el usuario encontrado.
        const usuario = usuarios[0];


        // =========================================
        // COMPROBACIÓN DE CONTRASEÑA
        // =========================================

        // Compara la contraseña enviada por el usuario
        // con el hash almacenado en la base de datos.
        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );


        // Si las contraseñas no coinciden, se rechaza el acceso.
        if (!passwordValida) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }


        // =========================================
        // GENERACIÓN DEL TOKEN JWT
        // =========================================

        // Genera un token firmado que contiene información básica
        // necesaria para identificar y autorizar al usuario.
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            },

            // Clave secreta utilizada para firmar el token.
            process.env.SECRET_KEY,

            {
                // El token será válido durante dos horas.
                expiresIn: '2h'
            }
        );


        // =========================================
        // RESPUESTA
        // =========================================

        // Devuelve el token junto con información básica del usuario.
        res.json({
            status: 'ok',
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {

        // Registra el error internamente.
        console.error('Error al iniciar sesión:', error);

        // Devuelve un mensaje genérico al cliente.
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
};


// =========================================
// EXPORTAR FUNCIONES
// =========================================

// Exporta los controladores para que puedan ser utilizados
// por las rutas definidas en usuarioRoutes.js.
module.exports = {
    registrarUsuario,
    iniciarSesion
};