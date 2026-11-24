const { ApiError } = require('./errors');

function validateId(req, res, next, value) {
    if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
        throw new ApiError(400, 'El identificador no es válido.');
    }
    next();
}

module.exports = { validateId };
