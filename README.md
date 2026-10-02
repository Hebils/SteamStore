# Ejecutar el frontend Gamix

El servidor `server.js` publica las paginas del frontend y reenvia `/api` al backend para evitar problemas de CORS(futuro).

1. Debes tener instalado XAMPP CONTROL PANEL:
   Luego de tenerlo instalado se debería de iniciar/levantar el Apache y MySQL.

2. Abrir el administrador del MySQL para ver localmente lo que refiera a la base de datos que se crea con las funciones SQL, poder ver las tablas, la información, todo dentro. Esto claramente aparece luego de haber insertado las funciones sql paso a paso del archivo "allDatabases.sql".

3. Desde la raiz del proyecto, instala dependencias si aun no lo has hecho y arranca el backend:

   ```bash
   npm install
   node src/server.js
   ```

4. Abre otra terminal en la raiz y arranca el frontend:

   ```bash
   node Frontend/server.js
   ```

5. Abre <http://127.0.0.1:5501>. No uses Live Server: ese servidor no reenvia las peticiones de API y responde `405` al enviar el formulario.

El backend usa MySQL mediante `mysql2`. Enciende MySQL y ejecuta `allDatabases.sql`.

6. Agregar un archivo `.env` a la altura de la raiz del proyecto con las siguientes variables. Copia y pega.
PORT=3000

SECRET_KEY=miclavesupersegura
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=steamstore_db

El `.env` no existe actualmente en el proyecto por lo que hay que crearlo directamente.

7. Si el puerto 5501 esta ocupado, configura `FRONTEND_PORT`. Para cambiar el puerto del backend, configura `API_PORT` con el mismo valor que `PORT`.

8. Para verificar la conexion al servidor de la base de datos ingresa a: http://localhost:3000/api/health y verifica que la conexión a la base de datos esté funcionando correctamente.

9. IMPORTANTE: Antes de desplegar todo instalar las dependencias en el directorio de la siguiente forma y en orden
9.1 npm install express mysql2 dotenv
9.2 npm install bcrypt
9.3 npm install jsonwebtoken