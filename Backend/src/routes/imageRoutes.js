const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/rolMiddleware');
const { validateId } = require('../middleware/validation');
const { receiveImage, validateImage } = require('../middleware/imageUpload');
const files = require('../services/imageService');

router.param('id', validateId);
function imageRoutes(path, type, readAccess, writeAccess) {
    const target = req => type === 'perfil' ? req.usuario.id : Number(req.params.id);
    router.get(path, ...readAccess, async (req, res) => {
        res.set('Cache-Control', 'no-store');
        res.json({ files: await files.list(type, target(req)) });
    });
    router.post(path, ...writeAccess, async (req, res, next) => {
        await files.checkTarget(pool, type, target(req), req.usuario.id);
        next();
    }, receiveImage, async (req, res) => {
        const image = await validateImage(req.file);
        const file = await files.save(type, target(req), req.usuario.id, image);
        res.status(201).json({ file });
    });
}

imageRoutes('/usuarios/me/imagenes', 'perfil', [auth], [auth]);
imageRoutes('/games/:id/imagenes', 'portada', [], [auth, role('admin')]);
imageRoutes('/resenas/:id/imagenes', 'resena', [], [auth]);

router.get('/usuarios/me/archivos', auth, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ files: await files.myUploads(req.usuario.id) });
});

module.exports = router;
