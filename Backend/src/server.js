// IMPORTACIONES

const express = require('express');
const path = require('node:path');

// Carga las variables de entorno desde la raíz del proyecto.
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

const PORT = Number(process.env.PORT) || 3000;

// Evita apuntar MySQL al mismo puerto que este servidor HTTP.
if (
    ['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST) &&
    Number(process.env.DB_PORT) === PORT
) {
    process.env.DB_PORT = '3306';
    console.warn('DB_PORT coincide con PORT; se usara el puerto local de MySQL 3306.');
}

// Importa la conexión a la base de datos.
const pool = require('./config/db');

// Importa las rutas relacionadas con los usuarios.
const usuarioRoutes = require('./routes/usuarioRoutes');

// Importa las rutas relacionadas con las reseñas
// (consultar, crear, modificar y eliminar reseñas).
const resenaRoutes = require('./routes/resenaRoutes');
const verificarToken = require('./middleware/authMiddleware');
const verificarRol = require('./middleware/rolMiddleware');


// CONFIGURACIÓN DE LA APLICACIÓN

const app = express();

// Permite recibir información en formato JSON.
app.use(express.json());


// RUTAS DEL BACKEND

// Rutas de autenticación y gestión de usuarios.
app.use('/api/usuarios', usuarioRoutes);

// Registra las rutas de reseñas bajo el prefijo /api.
//
// Ejemplos:
// GET /api/juegos/:id/resenas
// POST /api/juegos/:id/resenas
// PUT /api/resenas/:id
// DELETE /api/resenas/:id
app.use('/api', resenaRoutes);

// Catalogo de juegos. La base de datos asigna id y fecha_creacion.
const gameFields = `id, titulo, descripcion, genero, precio,
    desarrollador, fecha_lanzamiento, fecha_creacion`;

function validateGameData(body = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Envía los datos del juego en formato JSON.' };
    }
    const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
    const genero = typeof body.genero === 'string' ? body.genero.trim() : '';
    const desarrollador = typeof body.desarrollador === 'string' ? body.desarrollador.trim() : '';
    const precio = Number(body.precio);
    const fecha = body.fecha_lanzamiento || null;

    if (!titulo || titulo.length > 150) return { error: 'El título es obligatorio y debe tener máximo 150 caracteres.' };
    if (!genero || genero.length > 50) return { error: 'El género es obligatorio y debe tener máximo 50 caracteres.' };
    if (body.precio === undefined || body.precio === null || body.precio === '' || !Number.isFinite(precio) || precio < 0 || precio > 99999999.99) return { error: 'El precio debe ser un número válido mayor o igual a cero.' };
    if (desarrollador.length > 150) return { error: 'El desarrollador debe tener máximo 150 caracteres.' };
    if (fecha && (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha)) {
        return { error: 'La fecha de lanzamiento no es válida.' };
    }

    return {
        data: {
            titulo,
            descripcion: descripcion || null,
            genero,
            precio,
            desarrollador: desarrollador || null,
            fecha_lanzamiento: fecha
        }
    };
}

app.get('/api/games', async (req, res) => {
    try {
        const [games] = await pool.query(`SELECT ${gameFields} FROM juegos ORDER BY fecha_creacion DESC, id DESC`);
        res.json({ games });
    } catch (error) {
        console.error('Error al consultar el catalogo de juegos:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo cargar el catálogo de juegos.' });
    }
});

app.get('/api/games/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ status: 'error', message: 'El identificador del juego no es válido.' });
    }

    try {
        const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [id]);
        if (!games.length) return res.status(404).json({ status: 'error', message: 'Juego no encontrado.' });
        res.json({ game: games[0] });
    } catch (error) {
        console.error('Error al consultar un juego:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo cargar el juego.' });
    }
});

app.post('/api/games', verificarToken, verificarRol('admin'), async (req, res) => {
    const { data, error } = validateGameData(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error });

    try {
        const [result] = await pool.query(
            `INSERT INTO juegos (titulo, descripcion, genero, precio, desarrollador, fecha_lanzamiento)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [data.titulo, data.descripcion, data.genero, data.precio, data.desarrollador, data.fecha_lanzamiento]
        );
        const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [result.insertId]);
        res.status(201).json({ status: 'ok', game: games[0] });
    } catch (error) {
        console.error('Error al crear un juego:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo crear el juego.' });
    }
});

app.put('/api/games/:id', verificarToken, verificarRol('admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ status: 'error', message: 'El identificador del juego no es válido.' });
    }
    const { data, error } = validateGameData(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error });

    try {
        const [result] = await pool.query(
            `UPDATE juegos
             SET titulo = ?, descripcion = ?, genero = ?, precio = ?, desarrollador = ?, fecha_lanzamiento = ?
             WHERE id = ?`,
            [data.titulo, data.descripcion, data.genero, data.precio, data.desarrollador, data.fecha_lanzamiento, id]
        );
        if (!result.affectedRows) {
            const [existing] = await pool.query('SELECT id FROM juegos WHERE id = ?', [id]);
            if (!existing.length) return res.status(404).json({ status: 'error', message: 'Juego no encontrado.' });
        }
        const [games] = await pool.query(`SELECT ${gameFields} FROM juegos WHERE id = ?`, [id]);
        res.json({ status: 'ok', game: games[0] });
    } catch (error) {
        console.error('Error al actualizar un juego:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo actualizar el juego.' });
    }
});

app.delete('/api/games/:id', verificarToken, verificarRol('admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ status: 'error', message: 'El identificador del juego no es válido.' });
    }

    try {
        const [result] = await pool.query('DELETE FROM juegos WHERE id = ?', [id]);
        if (!result.affectedRows) return res.status(404).json({ status: 'error', message: 'Juego no encontrado.' });
        res.json({ status: 'ok', message: 'Juego eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar un juego:', error);
        res.status(500).json({ status: 'error', message: 'No se pudo eliminar el juego.' });
    }
});


// VERIFICACIÓN DEL SERVIDOR Y BASE DE DATOS (api/health)

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'ok',
            message: 'Servidor y base de datos funcionando correctamente'
        });

    } catch (error) {
        console.error('Error de conexión con la base de datos:', error);

        res.status(500).json({
            status: 'error',
            message: 'No se pudo conectar con la base de datos'
        });
    }
});



// CONFIGURACIÓN DEL FRONTEND

// Obtiene las rutas de las carpetas desde la raíz del proyecto.
const frontendPath = path.resolve(__dirname, '../../Frontend');
const cssPath = path.resolve(__dirname, '../../css');

// Sirve los archivos CSS compartidos desde /css.
app.use('/css', express.static(cssPath));

// Sirve los archivos del frontend: HTML, JS, imágenes, etc.
app.use(express.static(frontendPath));

// Rutas de las paginas del frontend, guardadas en src/pages.
const pagesPath = path.join(frontendPath, 'src', 'pages');

app.get(['/', '/store'], (req, res) => {
    res.sendFile(path.join(pagesPath, 'store.html'));
});

app.get(['/login', '/login.html'], (req, res) => {
    res.sendFile(path.join(pagesPath, 'login.html'));
});

app.get(['/register', '/registro.html'], (req, res) => {
    res.sendFile(path.join(pagesPath, 'register.html'));
});

app.get('/library', (req, res) => {
    res.sendFile(path.join(pagesPath, 'library.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(pagesPath, 'profile.html'));
});

app.get('/purchases', (req, res) => {
    res.sendFile(path.join(pagesPath, 'purchases.html'));
});

app.get('/games/:id', (req, res) => {
    res.sendFile(path.join(pagesPath, 'game.html'));
});


// INICIO DEL SERVIDOR

app.listen(PORT, () => {
    console.log('       STEAMSTORE - SERVIDOR ACTIVO');
    console.log(`Frontend:      http://localhost:${PORT}`);
    console.log(`Tienda:        http://localhost:${PORT}/store`);
    console.log(`Registro:      http://localhost:${PORT}/register`);
    console.log(`Inicio sesión: http://localhost:${PORT}/login`);
    console.log(`API Health:    http://localhost:${PORT}/api/health`);
});
