# Ejecutar el frontend Gamix

El servidor `server.js` publica las páginas del frontend y reenvía `/api` al backend para evitar problemas de CORS (futuro).

1. **Debes tener instalado XAMPP Control Panel:**

   Luego de tenerlo instalado, se debería iniciar/levantar Apache y MySQL.

2. **Abrir el administrador de MySQL:**

   Permite visualizar localmente la base de datos que se crea con las funciones SQL, consultar las tablas y su información. Esto aparece luego de haber ejecutado paso a paso las instrucciones del archivo `allDatabases.sql`.

3. **Instalar las dependencias y arrancar el servidor:**

   Desde la raíz del proyecto, instala las dependencias si aún no lo has hecho y arranca el servidor:

   ```bash
   npm install
   node Backend/src/server.js
   ```


5. **Abrir la aplicación:**

   Ingresa a [http://localhost:3000](http://localhost:3000).

   No uses Live Server: ese servidor no reenvía las peticiones de API y responde `405` al enviar el formulario.

El backend usa MySQL mediante `mysql2`. Enciende MySQL y ejecuta `allDatabases.sql`.

6. **Crear el archivo `.env`:**

   Agrega un archivo `.env` en la raíz del proyecto con las siguientes variables. Copia y pega el contenido:

   ```env
   PORT=3000
   SECRET_KEY=miclavesupersegura
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=steamstore_db
   ```

   El archivo `.env` no existe actualmente en el proyecto, por lo que hay que crearlo directamente.

7. Si el puerto 5501 está ocupado, configura `FRONTEND_PORT`. Para cambiar el puerto del backend, configura `API_PORT` con el mismo valor que `PORT`.

8. **Verificar la conexión a la base de datos:**

   Ingresa a [http://localhost:3000/api/health](http://localhost:3000/api/health) y verifica que la conexión a la base de datos esté funcionando correctamente.

9. **IMPORTANTE: Instalar las dependencias antes de desplegar el proyecto.**

   Ejecuta los siguientes comandos en la raíz del proyecto y en este orden:

   1. `npm install express mysql2 dotenv`
   2. `npm install bcrypt`
   3. `npm install jsonwebtoken`

## Módulo de reseñas

El módulo de reseñas permite que los usuarios consulten y compartan opiniones sobre los videojuegos disponibles en SteamStore. Los usuarios autenticados pueden crear, modificar y eliminar sus propias reseñas.

### Endpoints disponibles

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| GET | `/api/juegos/:id/resenas` | Consultar las reseñas de un videojuego. | No |
| POST | `/api/juegos/:id/resenas` | Crear una reseña para un videojuego. | Sí |
| PUT | `/api/resenas/:id` | Modificar una reseña propia. | Sí |
| DELETE | `/api/resenas/:id` | Eliminar una reseña propia. | Sí |

### Funcionamiento de las operaciones

- **Consultar reseñas:** obtiene las reseñas asociadas a un videojuego, incluyendo el nombre del usuario que las publicó.
- **Crear reseña:** recibe una calificación entre 1 y 5 y un comentario opcional. Verifica que el videojuego exista y asocia la reseña al usuario autenticado.
- **Modificar reseña:** permite actualizar la calificación y el comentario, siempre que la reseña pertenezca al usuario autenticado.
- **Eliminar reseña:** elimina una reseña únicamente cuando pertenece al usuario autenticado.

### Datos enviados

Para crear una reseña mediante POST, se utiliza un cuerpo JSON:

```json
{
  "calificacion": 5,
  "comentario": "Muy buen juego"
}
```

Para modificarla mediante PUT, se utiliza la misma estructura.

Las operaciones POST, PUT y DELETE requieren un token de autenticación enviado en la cabecera `Authorization` con el formato `Bearer token`.

### Pruebas realizadas

Se realizaron pruebas mediante Postman para comprobar el funcionamiento de los cuatro endpoints:

- Consulta de reseñas de un videojuego.
- Creación de reseñas con un usuario autenticado.
- Modificación de reseñas propias.
- Eliminación de reseñas propias.
- Rechazo de solicitudes de creación sin token.
- Verificación de que un usuario no pueda modificar ni eliminar reseñas pertenecientes a otro usuario.

Las pruebas permitieron comprobar el funcionamiento del CRUD y las restricciones de acceso correspondientes.
