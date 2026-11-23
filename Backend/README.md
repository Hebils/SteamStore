# Backend de Gamix

Express sirve la tienda y la API en el mismo puerto. MariaDB de XAMPP guarda usuarios, catálogo, carrito, compras, reseñas y metadatos. Supabase Storage guarda las imágenes en el bucket privado `gamix-imagenes`.

## Arranque local

1. Inicia Apache y MySQL en XAMPP. Para una instalación nueva, crea la base vacía `steamstore_db` en phpMyAdmin con codificación `utf8mb4`.
2. Desde la raíz de SteamStore, con Node.js 24, ejecuta `npm ci`. Si aún no tienes `.env`, copia `.env.example` como `.env`. Configura el acceso a MariaDB y una `SECRET_KEY` aleatoria propia. Puedes generarla con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
3. Ejecuta `node Backend/scripts/preparar-db.js`. Sirve tanto para una instalación vacía como para actualizar la base del avance 2. El script conserva registros y admite repetición. El archivo histórico `allDatabases.sql` contiene instrucciones de borrado y se excluye de este procedimiento. En una base de demostración puedes añadir dos juegos con `node Backend/scripts/preparar-db.js --demo`.
4. El proyecto de Supabase **JUANSUAREZ97's Project** ya tiene el bucket privado `gamix-imagenes` en su instancia principal. Configura `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en el `.env` del backend. En el panel del proyecto encontrarás la URL en **Connect** y la clave de servidor en **Settings → API Keys**. Ejecuta `node Backend/scripts/preparar-storage.js` para comprobar que el bucket sea privado, tenga un límite de 5 MiB y acepte PNG/JPEG. Si estás preparando una instalación nueva, el mismo comando crea el bucket cuando falta.
5. Arranca con `node .\Backend\src\server.js`. Abre la tienda en `http://localhost:3000/store`. La ruta `GET /api/health` ejecuta `SELECT 1` y devuelve su JSON habitual. Si el cliente se sirve desde otro origen, añádelo a `CORS_ORIGINS` (lista de orígenes completos separados por comas) y reinicia el servidor.

El registro público crea usuarios con rol `usuario`. Para probar la administración usa la cuenta administradora del equipo. En una base de demostración propia puedes registrar una cuenta y asignarle el rol `admin` desde phpMyAdmin.

## Contrato para la integración

Todas las rutas siguientes llevan el prefijo `/api`. Las privadas reciben el encabezado `Authorization: Bearer <token>`. Los errores exponen `{ "status": "error", "message": "…" }`.

| Método y ruta | Acceso | Uso y respuesta |
|---|---|---|
| POST `/usuarios/registro`, POST `/usuarios/login` | Público | Registro con nombre, email y password. Login con email y password. Devuelve token y usuario. |
| GET `/usuarios/perfil`, GET `/usuarios/me` | Sesión | Devuelven `usuario` con los datos actuales de MariaDB. |
| GET `/games`, GET `/games/:id` | Público | Catálogo en `games` y detalle en `game`. |
| POST `/games`, PUT y DELETE `/games/:id` | Admin | Crear, editar o retirar un juego. POST y PUT reciben titulo, genero, precio y opcionalmente descripcion, desarrollador, fecha_lanzamiento (AAAA-MM-DD). El retiro conserva compras previas. |
| GET `/cart` | Sesión | Devuelve `items` con id, titulo, precio y publicado. |
| PUT o DELETE `/cart/items/:id` | Sesión | Añade o quita un juego del carrito, sin cuerpo. Respuesta 204. Cada juego ocupa un único lugar. |
| POST `/purchases` | Sesión | Confirma todo el carrito sin cuerpo. Devuelve 201 con `purchase` (id, total, items). |
| GET `/purchases`, GET `/library` | Sesión | Historial propio en `purchases` con precio pagado y artículos. Biblioteca en `games` con fecha de adquisición. |
| GET o POST `/juegos/:id/resenas` | Lectura pública, escritura con sesión | Crear con calificacion de 1 a 5 y comentario opcional. |
| PUT o DELETE `/resenas/:id` | Autor | Modifica o elimina la reseña. |
| GET o POST `/usuarios/me/imagenes` | Sesión | Imágenes de perfil de la cuenta actual. La primera de la lista es la más reciente. |
| GET o POST `/games/:id/imagenes` | Lectura pública, escritura admin | Portadas del juego publicado. |
| GET o POST `/resenas/:id/imagenes` | Lectura pública, escritura del autor | Imágenes asociadas a una reseña existente. |
| GET `/usuarios/me/archivos` | Sesión | Todas las subidas propias, incluidas imágenes cuya reseña fue eliminada. |

**Compra simulada.** El botón «Añadir» llama a PUT y «Confirmar compra» llama a POST. El servidor determina el usuario con el JWT y suma los precios de MariaDB. El total, los detalles de compra y el vaciado del carrito se confirman en una sola transacción. Un carrito vacío, un juego retirado o una adquisición repetida devuelve 409. Si se pierde la respuesta al confirmar, consulta el historial y el carrito antes de volver a intentarlo.

**Imágenes.** Usa el servicio existente `fileService.upload(endpoint, file, token)` con un solo campo multipart llamado `file`. Acepta PNG, JPG y JPEG de hasta 5 MiB y 20 megapíxeles. El backend comprueba el contenido, elimina metadatos de la imagen y asigna un UUID al objeto. Guarda nombre original, MIME, peso del archivo almacenado, autor, fecha, asociación y ruta en MariaDB. POST devuelve `file` y GET devuelve `files`, del más reciente al más antiguo. Muestra `file.url` en la interfaz y vuelve a consultar la API al caducar el enlace (600 segundos). 413 indica exceso de peso, 415 indica imagen inválida y 503 indica que faltan las variables del servicio.

## Demostración del flujo

Publica un juego con el administrador, inicia sesión con una segunda cuenta y agrega el juego al carrito. Confirma la compra y vuelve a consultar historial y biblioteca tras reiniciar el servidor. Sube una imagen de perfil, recarga la lista y abre el enlace firmado. En el panel de Supabase se verá el objeto con UUID y en MariaDB su registro asociado al usuario.

## Prueba de regresión de compras

Con MariaDB local activo, ejecuta `npm test` desde la raíz. Usa una base temporal con un nombre aleatorio para comprobar dos confirmaciones simultáneas y la recuperación tras un fallo al guardar el detalle. La cuenta local necesita permiso para crear y eliminar esa base temporal.

## Verificación con Supabase real

El 22 de noviembre de 2026 se probó la subida desde Express con una cuenta de prueba y una base MariaDB temporal. La ruta de imágenes del perfil devolvió HTTP 201. Al consultar el perfil, la API recuperó los metadatos y generó un enlace firmado al bucket privado. La descarga devolvió HTTP 200 y se verificaron tanto el formato PNG como el tamaño registrado en MariaDB. Al terminar se retiraron el objeto y la base de prueba.

Para repetir la comprobación, inicia sesión y envía una imagen en el campo multipart `file` a `POST /api/usuarios/me/imagenes`. Con el mismo token, llama a `GET /api/usuarios/me/imagenes`, abre el enlace de la imagen y compara los bytes descargados con `tamano`.
