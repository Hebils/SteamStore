const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// =========================================
// REGISTRO DE USUARIO
// =========================================

const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Validar datos obligatorios
        if (!nombre || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Nombre, email y contraseña son obligatorios'
            });
        }

        // Verificar si el email ya existe
        const [usuarios] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarios.length > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'El correo electrónico ya está registrado'
            });
        }

        // Encriptar contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Crear usuario
        const [resultado] = await pool.query(
            `INSERT INTO usuarios (nombre, email, password)
             VALUES (?, ?, ?)`,
            [nombre, email, passwordHash]
        );

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
        console.error('Error al registrar usuario:', error);

        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
};


// =========================================
// INICIO DE SESIÓN
// =========================================

const iniciarSesion = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email y contraseña son obligatorios'
            });
        }

        // Buscar usuario
        const [usuarios] = await pool.query(
            `SELECT id, nombre, email, password, rol
             FROM usuarios
             WHERE email = ?`,
            [email]
        );

        // Usuario no encontrado
        if (usuarios.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }

        const usuario = usuarios[0];

        // Comparar contraseña
        const passwordValida = await bcrypt.compare(
            password,
            usuario.password
        );

        // Contraseña incorrecta
        if (!passwordValida) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales incorrectas'
            });
        }

        // Crear JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.SECRET_KEY,
            {
                expiresIn: '2h'
            }
        );

        // Respuesta
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
        console.error('Error al iniciar sesión:', error);

        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
};


// =========================================
// EXPORTAR FUNCIONES
// =========================================

module.exports = {
    registrarUsuario,
    iniciarSesion
};