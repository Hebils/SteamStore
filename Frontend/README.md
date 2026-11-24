# Frontend Gamix

Interfaz de terminal en HTML, CSS y módulos JavaScript. Express sirve las páginas y la API desde el mismo origen. No necesita compilación.

## Ejecutar

Desde la raíz, con las dependencias instaladas y MariaDB configurada según [la guía del backend](../Backend/README.md):

```sh
node Backend/src/server.js
```

Abre http://localhost:3000/store.

## Pantallas y recorrido

| Ruta | Función |
| --- | --- |
| /store | Catálogo con búsqueda por título/género, añadir al carrito y administración de juegos. |
| /games/:id | Detalle, precio, lanzamiento y acceso al carrito o a la biblioteca según el estado. |
| /cart | Selección, total estimado, quitar/deshacer, revisión y confirmación de compra simulada. |
| /library | Juegos adquiridos, fecha de adquisición, búsqueda y conservación de juegos retirados. |
| /purchases | Comprobantes con fecha, importe y precios pagados; búsqueda por juego o número. |
| /profile | Consulta del perfil existente. |
| /login y /register | Acceso con retorno al destino solicitado, incluida la nueva ruta del carrito. |

Carrito, biblioteca, compras y perfil verifican la sesión con el servidor. Los invitados pueden explorar juegos y reciben el inicio de sesión al intentar adquirirlos. Las reseñas, imágenes, archivos y edición del perfil quedan fuera de esta implementación.

## Componentes y servicios

- **api.js:** transporte JSON/multipart, errores HTTP, caché desactivada y espera máxima de 20 segundos. No reintenta escrituras automáticamente.
- **authService.js / session.js:** sesión, retorno seguro y tratamiento de credenciales caducadas o revocadas.
- **commerceService.js:** contratos de carrito, compras y biblioteca. Las compras no envían precios, identificadores de usuario ni artículos en el cuerpo; el backend obtiene todo del carrito autenticado.
- **commerceState.js:** estado compartido de carrito y biblioteca, actualizado desde la API; evento `commerce:change` para sincronizar contador y acciones. No persiste el carrito en el navegador.
- **navigation.js:** navegación única para las pantallas de la tienda, ubicación actual, perfil y contador del carrito.
- **gameCard.js / purchaseAction.js:** tarjetas reutilizables para catálogo y biblioteca, acciones de adquisición separadas del contenido. Los juegos retirados de la biblioteca no enlazan a una ficha pública inexistente.
- **ui.js:** texto seguro, formatos compartidos, estados vacíos y diálogo accesible de confirmación.
- **cart.js / collection.js:** coordinación del carrito/compra y de las colecciones privadas respectivamente.

Los importes mantienen el símbolo $ y dos decimales. El contrato existente no especifica una divisa; no se inventa COP o USD. Los totales de la interfaz se suman en centavos y son estimados; la respuesta de compra del servidor determina el importe registrado.

## Confirmación y recuperación

Antes de mostrar la confirmación se consultan carrito, biblioteca e historial. Antes de enviar se comprueba de nuevo que la selección y sus precios no hayan cambiado. El botón se bloquea mientras se procesa la solicitud.

Antes del POST se guarda en sessionStorage un intento pendiente, separado por usuario, con los juegos y los IDs de compras previas. Si falla la conexión, llega una respuesta de servidor incierta o se recarga la página, «Comprobar compra» consulta tanto historial como carrito. Si encuentra la adquisición nueva, muestra su comprobante sin repetir el POST. Si alguna consulta falla, conserva el bloqueo. Si no encuentra la compra tras consultar ambas rutas, permite revisar la selección antes de otro intento explícito.

Esta recuperación utiliza el contrato existente, que no expone una clave de idempotencia. El backend sigue siendo responsable de impedir adquisiciones repetidas mediante la transacción y la comprobación de propiedad. No se realizan reintentos automáticos de compra.

## Preparación para las siguientes integraciones

- Las futuras reseñas pueden consultar propiedad en commerceState o commerceService.library; el backend debe seguir validando permisos.
- Las portadas podrán incorporarse a gameCard y al detalle sin alterar las acciones de compra.
- fileService conserva su función multipart para la futura integración de imágenes; no se llama desde estas pantallas.
- Perfil conserva su ruta y la presentación de datos; la edición podrá añadirse sin duplicar navegación ni autenticación.
- No se muestran botones inactivos ni accesos a funciones todavía no implementadas.

## Usabilidad

Aplicación de las [heurísticas de Nielsen](https://www.nngroup.com/articles/ten-usability-heuristics/):

| Principio | Decisión aplicada |
| --- | --- |
| Visibilidad del estado | Cargas, resultados, contador, botones ocupados y confirmación de compra. |
| Lenguaje familiar | Acciones en español; comandos de terminal como contexto visual. |
| Control del usuario | Volver desde el diálogo, Escape y deshacer al quitar del carrito. |
| Consistencia | Navegación, tarjetas, precios y controles compartidos. |
| Prevención de errores | Revisión previa, comprobación de disponibilidad y bloqueo durante la compra. |
| Reconocimiento | Selección y total visibles; accesos a carrito, biblioteca y comprobantes. |
| Eficiencia | Búsquedas en catálogo, biblioteca e historial; compra desde catálogo o detalle. |
| Diseño minimalista | Jerarquía de acciones, ayudas desplegables y ausencia de módulos pendientes en el recorrido. |
| Recuperación de errores | Reintentos explícitos, conservación de formularios y verificación de compras inciertas. |
| Ayuda | Explicación de compra simulada, biblioteca e historial dentro de cada pantalla. |

La revisión automatizada complementa la inspección visual y las pruebas de teclado; no sustituye pruebas de usabilidad con personas.

## Pruebas

```sh
npm run test:frontend
```

Playwright inicia el servidor real de Express en el puerto 3187 y sustituye las respuestas de la API con datos aislados. No crea usuarios ni compras en MariaDB. Comprueba el recorrido de compra, quitar/deshacer, respuesta perdida, cambios de precio, juegos retirados/adquiridos, sesiones, errores, búsquedas, importes cero, teclado, diálogos, páginas sin desbordamiento y accesibilidad con axe. Se ejecuta en vistas de escritorio y móvil.

En Windows usa Edge instalado. En otros sistemas utiliza Chromium de Playwright (instalarlo con `npx playwright install chromium` si falta). Se puede elegir otro canal instalado con PLAYWRIGHT_CHANNEL. Las capturas y trazas se guardan en test-results, excluido de Git.

La prueba existente `npm test` necesita MariaDB local y comprueba las transacciones del backend; es independiente de las pruebas de interfaz.