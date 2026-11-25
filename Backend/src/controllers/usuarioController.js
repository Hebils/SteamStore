const { ApiError } = require('../middleware/errors');
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registrarUsuario = async (req, res) => {
    const { nombre, email, password } = req.body || {};

    if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        nombre.length > 100 ||
        typeof email !== 'string' ||
        email.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== 'string' ||
        !password ||
        Buffer.byteLength(password) > 72
    ) {
        throw new ApiError(
            400,
            'Revisa el nombre, el correo y la contraseña (máximo 72 bytes).'
        );
    }

    const [usuarios] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [email]
    );

    if (usuarios.length > 0) {
        throw new ApiError(409, 'El correo electrónico ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

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
};

const iniciarSesion = async (req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== 'string' ||
        !email ||
        typeof password !== 'string' ||
        !password
    ) {
        throw new ApiError(400, 'Email y contraseña son obligatorios');
    }

    const [usuarios] = await pool.query(
        `SELECT id, nombre, email, password, rol
         FROM usuarios
         WHERE email = ?`,
        [email]
    );

    if (usuarios.length === 0) {
        throw new ApiError(401, 'Credenciales incorrectas');
    }

    const usuario = usuarios[0];

    const passwordValida = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordValida) {
        throw new ApiError(401, 'Credenciales incorrectas');
    }

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
};

const actualizarPerfil = async (req, res) => {
    const { nombre, email } = req.body || {};

    const nombreLimpio =
        typeof nombre === 'string' ? nombre.trim() : '';

    const emailLimpio =
        typeof email === 'string'
            ? email.trim().toLowerCase()
            : '';

    if (
        !nombreLimpio ||
        nombreLimpio.length > 100 ||
        !emailLimpio ||
        emailLimpio.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)
    ) {
        throw new ApiError(
            400,
            'Revisa el nombre y el correo electrónico.'
        );
    }

    const [usuarios] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ? AND id <> ?',
        [emailLimpio, req.usuario.id]
    );

    if (usuarios.length > 0) {
        throw new ApiError(
            409,
            'Ese correo electrónico ya está registrado.'
        );
    }

    try {
        await pool.query(
            `UPDATE usuarios
             SET nombre = ?, email = ?
             WHERE id = ?`,
            [nombreLimpio, emailLimpio, req.usuario.id]
        );
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new ApiError(
                409,
                'Ese correo electrónico ya está registrado.'
            );
        }

        throw error;
    }

    const usuario = {
        id: req.usuario.id,
        nombre: nombreLimpio,
        email: emailLimpio,
        rol: req.usuario.rol
    };

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

    res.json({
        status: 'ok',
        message: 'Perfil actualizado correctamente.',
        token,
        usuario
    });
};

module.exports = {
    registrarUsuario,
    iniciarSesion,
    actualizarPerfil
};
