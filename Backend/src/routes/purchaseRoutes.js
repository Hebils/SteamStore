const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { validateId } = require('../middleware/validation');
const { ApiError } = require('../middleware/errors');
const purchases = require('../services/purchaseService');

router.param('id', validateId);
router.get('/cart', auth, async (req, res) => {
    res.json({ items: await purchases.getCart(req.usuario.id) });
});

router.put('/cart/items/:id', auth, async (req, res) => {
    await purchases.addGame(req.usuario.id, Number(req.params.id));
    res.sendStatus(204);
});

router.delete('/cart/items/:id', auth, async (req, res) => {
    await purchases.removeGame(req.usuario.id, Number(req.params.id));
    res.sendStatus(204);
});

router.post('/purchases', auth, async (req, res) => {
    if (req.body !== undefined && (Array.isArray(req.body) || Object.keys(req.body).length)) {
        throw new ApiError(400, 'La compra usa tu carrito y los precios del catálogo. Envía el cuerpo vacío.');
    }
    const purchase = await purchases.checkout(req.usuario.id);
    res.status(201).json({ status: 'ok', purchase });
});

router.get('/purchases', auth, async (req, res) => {
    res.json({ purchases: await purchases.history(req.usuario.id) });
});

router.get('/library', auth, async (req, res) => {
    res.json({ games: await purchases.library(req.usuario.id) });
});

module.exports = router;
