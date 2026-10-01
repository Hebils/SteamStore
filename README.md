# Ejecutar el frontend Gamix

El servidor `server.js` publica las paginas del frontend y reenvia `/api` al backend para evitar problemas de CORS.

1. Desde la raiz del proyecto, instala dependencias si aun no lo has hecho y arranca el backend:

   ```bash
   npm install
   node src/server.js
   ```

2. Abre otra terminal en la raiz y arranca el frontend:

   ```bash
   node Frontend/server.js
   ```

3. Abre <http://127.0.0.1:5501>. No uses Live Server: ese servidor no reenvia las peticiones de API y responde `405` al enviar el formulario.

El backend usa MySQL mediante `mysql2`. Enciende MySQL y ejecuta `allDatabases.sql`. Configura un `.env` en la raiz del proyecto con estas variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena
DB_NAME=steamstore_db
SECRET_KEY=una_clave_secreta_larga
```

El `.env` no existe actualmente en el proyecto. Las rutas usadas son `POST /api/usuarios/login` y `POST /api/usuarios/registro`. El token y los datos del usuario se guardan en `sessionStorage` al iniciar sesion.

Si el puerto 5501 esta ocupado, configura `FRONTEND_PORT`. Para cambiar el puerto del backend, configura `API_PORT` con el mismo valor que `PORT`.
