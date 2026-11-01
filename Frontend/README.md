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

Desde la raiz del proyecto, inicia primero el backend y luego el servidor del frontend:

```bash
node Backend/src/server.js
node Frontend/server.js
```

Abre la URL que muestra el servidor frontend (por defecto `http://127.0.0.1:5501`). No abras las paginas con Live Server porque no aplica las rutas ni el proxy a la API.

## API y pantallas

- `services/api.js` centraliza GET, POST, PUT, DELETE y carga multipart; incluye Bearer y errores HTTP.
- `services/authService.js` guarda el JWT en `sessionStorage`, verifica expiracion y consulta el perfil o el permiso admin.
- `services/gameService.js` organiza listado, detalle, creacion, edicion y eliminacion de juegos.
- `services/fileService.js` deja el envio multipart centralizado para cuando exista una ruta de archivos.
- `components/gameCard.js` renderiza tarjetas de juego y acciones de administracion sin interpolar HTML de la API.

Las rutas privadas consultan `GET /api/usuarios/perfil`. Las acciones CRUD visibles para administradores tambien consultan `GET /api/usuarios/admin` antes de enviar el JWT a los endpoints de juegos.

El backend actual expone autenticacion y rese&ntilde;as, pero aun no define `GET/POST /api/games`, `GET/PUT/DELETE /api/games/:id` ni una ruta de carga de archivos. Por eso el frontend muestra carga, errores, reintento y catalogo vacio sin sustituir respuestas del servidor por datos de prueba. Para que el CRUD persista, el backend debe implementar esos endpoints y comprobar alli el rol admin.
