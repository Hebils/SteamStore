const multer = require('multer');
const sharp = require('sharp');
const path = require('node:path');
const { ApiError } = require('./errors');
const { maxBytes } = require('../services/storage');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 1, fields: 0, parts: 2, fileSize: maxBytes }
}).single('file');

function receiveImage(req, res, next) {
    upload(req, res, error => {
        if (!error) return next();
        if (error.code === 'LIMIT_FILE_SIZE') return next(new ApiError(413, 'La imagen supera los 5 MiB.'));
        return next(new ApiError(400, 'Envía una sola imagen en el campo file.'));
    });
}

async function validateImage(file) {
    if (!file) throw new ApiError(400, 'Falta el archivo de imagen.');
    const extension = path.extname(file.originalname).toLowerCase();
    const format = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg' }[extension];
    if (!format || file.mimetype !== 'image/' + format) throw new ApiError(415, 'Usa una imagen PNG o JPG.');
    if (Array.from(file.originalname).length > 255) throw new ApiError(400, 'El nombre del archivo es demasiado largo.');
    try {
        const image = sharp(file.buffer, { limitInputPixels: 20000000, failOn: 'warning' });
        if ((await image.metadata()).format !== format) throw new Error('Formato diferente');
        // Decodificar la imagen completa y quitar metadatos antes de almacenarla.
        const bytes = await image.rotate().toFormat(format).toBuffer();
        if (bytes.length > maxBytes) throw new ApiError(413, 'La imagen procesada supera los 5 MiB.');
        return { bytes, extension: format === 'jpeg' ? '.jpg' : '.png', mime: file.mimetype, name: file.originalname };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(415, 'La imagen está dañada, supera los 20 megapíxeles o su contenido no coincide con el formato.');
    }
}

module.exports = { receiveImage, validateImage };
