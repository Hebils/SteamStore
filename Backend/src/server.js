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
const { ApiError, errorHandler } = require('./middleware/errors');


// CONFIGURACIÓN DE LA APLICACIÓN

const app = express();

// Permite recibir información en formato JSON.
app.use('/api', require('./middleware/cors'));
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
app.use('/api', require('./routes/purchaseRoutes'));

app.use('/api/games', require('./routes/gameRoutes'));

// VERIFICACIÓN DEL SERVIDOR Y BASE DE DATOS (api/health)

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'ok',
            message: 'Servidor y base de datos funcionando correctamente'
        });

    } catch (error) {
        throw new ApiError(500, 'No se pudo conectar con la base de datos');
    }
});



app.use('/api', () => { throw new ApiError(404, 'Ruta de API no encontrada.'); });
app.use(errorHandler);

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
