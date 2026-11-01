# Frontend Gamix

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/store` | Pública | Catálogo |
| `/games/:id` | Pública | Detalle del juego |
| `/login` | Pública | Inicio de sesión |
| `/register` | Pública | Registro |
| `/library` | Privada | Biblioteca |
| `/profile` | Privada | Perfil |
| `/purchases` | Privada | Historial de compras |

`Frontend/server.js` resuelve las rutas y reenvía `/api/*` al backend. Inicia primero el backend y luego ejecuta `node Frontend/server.js`; abre la dirección que muestra la terminal (por defecto `http://127.0.0.1:5501`). No abras estas vistas con Live Server porque sus rutas no ejecutan el proxy.

La sesión usa el JWT emitido por el backend, guardado junto con el usuario en `sessionStorage`. El cliente revisa su expiración, valida rutas privadas contra `GET /api/usuarios/perfil` con `Authorization: Bearer <token>`, limpia la sesión vencida/inválida y permite cerrar sesión localmente.

## Integración disponible

- `POST /api/usuarios/login` y `POST /api/usuarios/registro` conectan los formularios actuales.
- `GET /api/usuarios/perfil` valida el token y proporciona los datos de perfil disponibles.
- La tienda y el detalle solicitan `GET /api/games` y `GET /api/games/:id`.
- El backend actual todavía no define endpoints de juegos, biblioteca ni compras. La interfaz muestra estados de carga, error o módulo pendiente y no inventa registros.

El cliente compartido `js/api.js` permite solicitudes asíncronas GET, POST, PUT y DELETE, incluye Bearer cuando se proporciona un token y conserva el código HTTP en los errores para que las pantallas lo puedan manejar.
