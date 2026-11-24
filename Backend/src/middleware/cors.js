// En el arranque habitual Express sirve el cliente y la API desde el mismo origen.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

module.exports = (req, res, next) => {
    const origin = req.get('Origin');
    res.vary('Origin');
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
        if (req.method === 'OPTIONS') return res.sendStatus(204);
    }
    next();
};
