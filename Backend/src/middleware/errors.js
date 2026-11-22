class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    let status = 500;
    let message = 'Error interno del servidor';
    if (error instanceof ApiError) {
        ({ status, message } = error);
    } else if (error.type === 'entity.parse.failed') {
        status = 400;
        message = 'El cuerpo de la solicitud debe ser JSON válido.';
    } else if (error.type === 'entity.too.large') {
        status = 413;
        message = 'La solicitud supera el tamaño permitido.';
    } else if (error.code === 'ER_DUP_ENTRY') {
        status = 409;
        message = 'El registro ya existe.';
    } else if (error.status >= 400 && error.status < 500) {
        status = error.status;
        message = 'Solicitud no válida.';
    }
    if (status >= 500) console.error(req.method, req.path, error.code || error.name);
    res.status(status).json({ status: 'error', message });
}

module.exports = { ApiError, errorHandler };
