// =========================================
// IMPORTACIONES
// =========================================

// Importa el framework Express, que se utiliza para crear
// el servidor HTTP y definir las rutas de la API.
const express = require('express');

// Carga las variables de entorno definidas en el archivo .env
// (por ejemplo PORT o las credenciales de la base de datos)
// y las hace disponibles en process.env.
require('dotenv').config();

// Importa el pool de conexiones a la base de datos.
// Permite ejecutar consultas reutilizando conexiones abiertas.
const pool = require('./config/db');

// Importa las rutas relacionadas con los usuarios
// (registro, login, consulta, etc.).
const usuarioRoutes = require('./routes/usuarioRoutes');


// =========================================
// CONFIGURACIÓN DE LA APLICACIÓN
// =========================================

// Crea la instancia principal de la aplicación Express.
const app = express();

// Habilita la lectura de cuerpos de petición en formato JSON.
//
// Gracias a este middleware, los datos enviados por el cliente
// estarán disponibles en req.body.
app.use(express.json());


// =========================================
// RUTAS DE LA API
// =========================================

// Registra las rutas de usuarios bajo el prefijo /api/usuarios.
//
// Ejemplo:
// Si usuarioRoutes define POST /login, la ruta completa será:
// POST /api/usuarios/login
app.use('/api/usuarios', usuarioRoutes);


// =========================================
// RUTA DE VERIFICACIÓN DE ESTADO (HEALTH CHECK)
// =========================================

/**
 * Comprueba que el servidor y la base de datos estén funcionando.
 *
 * Esta ruta es útil para monitoreo, despliegues y para verificar
 * rápidamente que la API está disponible.
 *
 * Flujo:
 * 1. Ejecuta una consulta simple (SELECT 1) en la base de datos.
 * 2. Si la consulta funciona, responde con estado 200.
 * 3. Si falla, registra el error y responde con estado 500.
 *
 /** @route GET /api/health
 /** @param {Object} req - Petición HTTP recibida.
 /** @param {Object} res - Respuesta HTTP enviada al cliente.
 /** @returns {Object} JSON con el estado del servidor y la base de datos.
 */
app.get('/api/health', async (req, res) => {

    try {

        // Ejecuta una consulta mínima para confirmar que
        // la conexión con la base de datos está activa.
        await pool.query('SELECT 1');

        // La base de datos respondió correctamente.
        res.json({
            status: 'ok',
            message: 'Servidor y base de datos funcionando correctamente'
        });

    } catch (error) {

        // Registra el error en la consola del servidor
        // para facilitar su diagnóstico.
        console.error('Error de conexión con la base de datos:', error);

        // Informa al cliente que no fue posible conectar
        // con la base de datos.
        res.status(500).json({
            status: 'error',
            message: 'No se pudo conectar con la base de datos'
        });
    }
});


// =========================================
// INICIO DEL SERVIDOR
// =========================================

// Define el puerto en el que escuchará el servidor.
//
// Usa el valor de la variable de entorno PORT y, si no está
// definida, utiliza el puerto 3000 por defecto.
const PORT = process.env.PORT || 3000;

// Inicia el servidor y lo deja escuchando peticiones
// en el puerto definido.
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});