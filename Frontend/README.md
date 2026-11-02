# Frontend Gamix

## Estructura

```text
Frontend/
├── server.js
├── auth.css
├── app.css
└── src/
    ├── components/
    │   ├── gameCard.js
    │   └── navigation.js
    ├── pages/
    │   ├── store.html / store.js
    │   ├── game.html / gameDetail.js
    │   ├── login.html / login.js
    │   ├── register.html / register.js
    │   ├── library.html
    │   ├── profile.html
    │   ├── purchases.html
    │   └── privatePage.js
    └── services/
        ├── api.js
        ├── authService.js
        ├── gameService.js
        └── fileService.js
```

## Ejecutar

Desde la raiz del proyecto, inicia el servidor:

```bash
node Backend/src/server.js
```

Abre `http://localhost:3000`. Este mismo servidor atiende las paginas, los recursos estaticos y la API.

## API y pantallas

- `services/api.js` centraliza GET, POST, PUT, DELETE y carga multipart; incluye Bearer y errores HTTP.
- `services/authService.js` guarda el JWT en `sessionStorage`, verifica expiracion y consulta el perfil o el permiso admin.
- `services/gameService.js` organiza listado, detalle, creacion, edicion y eliminacion de juegos.
- `services/fileService.js` deja el envio multipart centralizado para cuando exista una ruta de archivos.
- `components/gameCard.js` renderiza tarjetas de juego y acciones de administracion sin interpolar HTML de la API.

Las rutas privadas consultan `GET /api/usuarios/perfil`. El catalogo consume `GET /api/games` y `GET /api/games/:id`. Las acciones de administracion verifican `GET /api/usuarios/admin` y usan `POST /api/games`, `PUT /api/games/:id` y `DELETE /api/games/:id` con el JWT.

El formulario usa las columnas de la tabla `juegos`: `titulo`, `descripcion`, `genero`, `precio`, `desarrollador` y `fecha_lanzamiento`. La base de datos genera `id` y `fecha_creacion`; no se envian unidades ni imagen.
