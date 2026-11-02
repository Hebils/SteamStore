const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const frontendPath = __dirname;
const backendHost = process.env.API_HOST || '127.0.0.1';
const backendPort = Number(process.env.API_PORT || 3000);
const port = Number(process.env.FRONTEND_PORT || 5501);
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};
const appRoutes = new Map([
    ['/', 'src/pages/store.html'], ['/store', 'src/pages/store.html'], ['/index.html', 'src/pages/store.html'],
    ['/login', 'src/pages/login.html'], ['/login.html', 'src/pages/login.html'],
    ['/register', 'src/pages/register.html'], ['/registro', 'src/pages/register.html'],
    ['/registro.html', 'src/pages/register.html'], ['/library', 'src/pages/library.html'],
    ['/profile', 'src/pages/profile.html'], ['/purchases', 'src/pages/purchases.html']
]);

const server = http.createServer((request, response) => {
    if (request.url.startsWith('/api/')) {
        const proxy = http.request({
            hostname: backendHost,
            port: backendPort,
            path: request.url,
            method: request.method,
            headers: { ...request.headers, host: `${backendHost}:${backendPort}` }
        }, (apiResponse) => {
            response.writeHead(apiResponse.statusCode, apiResponse.headers);
            apiResponse.pipe(response);
        });

        proxy.on('error', () => {
            response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ message: 'No se pudo conectar con el backend. Inicia el servidor en el puerto 3000.' }));
        });
        request.pipe(proxy);
        return;
    }

    let requestedPath;
    try {
        requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end('Solicitud inválida');
        return;
    }

    const routePath = requestedPath.toLowerCase().replace(/\/$/, '') || '/';
    const gameRoute = /^\/games\/([a-zA-Z0-9_-]+)\/?$/.exec(requestedPath);
    const pageFile = appRoutes.get(routePath);
    const relativePath = pageFile || (gameRoute ? 'src/pages/game.html' : requestedPath.slice(1));
    // Los HTML existentes enlazan la hoja compartida como ../css/style.css.
    const filePath = requestedPath === '/css/style.css'
        ? path.resolve(frontendPath, '..', 'css', 'style.css')
        : path.resolve(frontendPath, relativePath);
    const isSharedStylesheet = requestedPath === '/css/style.css';
    if (!isSharedStylesheet && !filePath.startsWith(frontendPath + path.sep)) {
        response.writeHead(403).end('Acceso denegado');
        return;
    }

    fs.stat(filePath, (error, stat) => {
        if (error || !stat.isFile()) {
            response.writeHead(404).end('No encontrado');
            return;
        }
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        fs.createReadStream(filePath).pipe(response);
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Frontend listo en http://127.0.0.1:${port}`);
    console.log(`API reenviada a http://${backendHost}:${backendPort}`);
});
