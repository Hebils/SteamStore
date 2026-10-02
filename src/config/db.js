// Importa el módulo mysql2 utilizando su versión basada en Promises.
// Esto permite realizar consultas a MySQL utilizando async/await.
const mysql = require('mysql2/promise');

// Carga las variables de configuración definidas en el archivo .env.
// Estas variables contienen los datos de conexión a la base de datos.
require('dotenv').config();


// =========================================
// CONFIGURACIÓN DEL POOL DE CONEXIONES
// =========================================

// Crea un pool de conexiones hacia MySQL.
//
// Un pool permite administrar y reutilizar varias conexiones
// con la base de datos, evitando tener que crear una nueva
// conexión para cada petición realizada al servidor.
const pool = mysql.createPool({

    // Dirección del servidor donde se encuentra MySQL.
    host: process.env.DB_HOST,

    // Puerto utilizado por MySQL.
    port: process.env.DB_PORT,

    // Usuario utilizado para conectarse a MySQL.
    user: process.env.DB_USER,

    // Contraseña del usuario de MySQL.
    password: process.env.DB_PASSWORD,

    // Nombre de la base de datos que utilizará la aplicación.
    database: process.env.DB_NAME
});


// =========================================
// EXPORTAR CONEXIÓN
// =========================================

// Exporta el pool para que pueda ser utilizado
// desde los controladores y demás componentes del backend.
module.exports = pool;