const express = require('express');
require('dotenv').config();

const pool = require('./config/db');

const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

app.use(express.json());

app.use('/api/usuarios', usuarioRoutes);

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});