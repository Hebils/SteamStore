// IMPORTACIONES

const express = require('express');
const path = require('node:path');

// Carga las variables de entorno desde la raíz del proyecto.
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
});

// Importa la conexión a la base de datos.
const pool = require('./config/db');

// Importa las rutas relacionadas con los usuarios.
const usuarioRoutes = require('./routes/usuarioRoutes');


// CONFIGURACIÓN DE LA APLICACIÓN

const app = express();

// Permite recibir información en formato JSON.
app.use(express.json());


// RUTAS DEL BACKEND

// Rutas de autenticación y gestión de usuarios.
app.use('/api/usuarios', usuarioRoutes);



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


// INICIO DEL SERVIDOR

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('       STEAMSTORE - SERVIDOR ACTIVO');
    console.log(`Frontend:      http://localhost:${PORT}`);
    console.log(`Registro:      http://localhost:${PORT}/registro.html`);
    console.log(`Inicio sesión: http://localhost:${PORT}/login.html`);
    console.log(`API Health:    http://localhost:${PORT}/api/health`);
});
