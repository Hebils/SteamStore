# Gamix · SteamStore

La tienda y la API arrancan desde la raíz con `node .\Backend\src\server.js`.

La [guía del backend](Backend/README.md) incluye la preparación de XAMPP y Supabase, juegos de demostración y los endpoints que consume el frontend.

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
