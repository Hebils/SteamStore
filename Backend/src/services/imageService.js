const { randomUUID } = require('node:crypto');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errors');
const { bucket, resultOf } = require('./storage');
const transaction = require('./transaction');

const metadata = 'id, nombre_archivo, tipo_archivo, mime_type, tamano, fecha_creacion, autor_id, ruta';
const ttl = 600;
const columns = { perfil: 'usuario_id', portada: 'juego_id', resena: 'resena_id' };

async function checkTarget(db, type, targetId, userId, lock = false) {
    let query;
    let params = [targetId];
    if (type === 'portada') query = 'SELECT id FROM juegos WHERE id = ? AND publicado = 1';
    if (type === 'resena') {
        query = 'SELECT id FROM resenas WHERE id = ?';
        if (userId != null) {
            query += ' AND usuario_id = ?';
            params.push(userId);
        }
    }
    if (!query) return;
    const [[row]] = await db.execute(query + (lock ? ' LOCK IN SHARE MODE' : ''), params);
    if (!row) throw new ApiError(404, 'El juego o la reseña no está disponible.');
}

async function withUrls(files) {
    if (!files.length) return [];
    const signed = resultOf(await bucket().createSignedUrls(files.map(f => f.ruta), ttl));
    const urls = new Map(signed.map(item => [item.path, item.signedUrl]));
    return files.map(({ ruta, ...file }) => {
        const url = urls.get(ruta);
        if (!url) throw new ApiError(502, 'No se pudo generar el enlace de la imagen.');
        return { ...file, url, expiresIn: ttl };
    });
}

async function list(type, targetId) {
    await checkTarget(pool, type, targetId);
    const [files] = await pool.execute(`SELECT ${metadata} FROM archivos
        WHERE ${columns[type]} = ? AND tipo_archivo = ? AND autor_id IS NOT NULL ORDER BY id DESC`, [targetId, type]);
    return withUrls(files);
}

async function myUploads(userId) {
    const [files] = await pool.execute(`SELECT ${metadata} FROM archivos WHERE autor_id = ? ORDER BY id DESC`, [userId]);
    return withUrls(files);
}

async function save(type, targetId, author, image) {
    const objectPath = type + '/' + randomUUID() + image.extension;
    const store = bucket();
    try {
        resultOf(await store.upload(objectPath, image.bytes, { contentType: image.mime, upsert: false }));
        const [link] = await withUrls([{ ruta: objectPath }]);
        return await transaction(async db => {
            await checkTarget(db, type, targetId, author, true);
            const [insert] = await db.execute(`INSERT INTO archivos
                (usuario_id, juego_id, resena_id, autor_id, tipo_archivo, nombre_archivo, mime_type, tamano, ruta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                type === 'portada' ? null : author, type === 'portada' ? targetId : null,
                type === 'resena' ? targetId : null, author, type, image.name, image.mime, image.bytes.length, objectPath
            ]);
            const [files] = await db.execute(`SELECT ${metadata} FROM archivos WHERE id = ?`, [insert.insertId]);
            const { ruta, ...file } = files[0];
            return { ...file, url: link.url, expiresIn: ttl };
        });
    } catch (error) {
        // Cada ruta es única para esta subida. Compensar el fallo sin tocar imágenes previas.
        try {
            // Si se perdió la respuesta del COMMIT, verificar primero si MariaDB ya registró el archivo.
            const [[saved]] = await pool.execute('SELECT id FROM archivos WHERE autor_id = ? AND ruta = ?', [author, objectPath]);
            if (!saved) resultOf(await store.remove([objectPath]));
        } catch {
            console.error('Revisar la consistencia del archivo en Supabase:', objectPath);
        }
        throw error;
    }
}

module.exports = { list, myUploads, save, checkTarget };
