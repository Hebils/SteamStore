const { createClient } = require('@supabase/supabase-js');
const { ApiError } = require('../middleware/errors');

const bucketName = 'gamix-imagenes';
const maxBytes = 5 * 1024 * 1024;
const mimeTypes = ['image/png', 'image/jpeg'];
let client;

function storage() {
    const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new ApiError(503, 'Falta configurar el almacenamiento de imágenes.');
    client ??= createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }) }
    });
    return client.storage;
}

function resultOf(result) {
    if (result.error) {
        console.error('Supabase Storage:', result.error.statusCode || result.error.name);
        throw new ApiError(502, 'El almacenamiento de imágenes no pudo completar la operación.');
    }
    return result.data;
}

async function prepareBucket() {
    const api = storage();
    const buckets = resultOf(await api.listBuckets({ search: bucketName }));
    const existing = buckets.find(bucket => bucket.name === bucketName);
    if (existing) {
        if (existing.public) throw new Error('El bucket gamix-imagenes debe ser privado.');
        if (Number(existing.file_size_limit) !== maxBytes) throw new Error('El límite del bucket debe ser de 5 MiB.');
        const allowed = new Set(existing.allowed_mime_types);
        if (allowed.size !== mimeTypes.length || !mimeTypes.every(type => allowed.has(type))) {
            throw new Error('El bucket debe aceptar únicamente image/png e image/jpeg.');
        }
        return;
    }
    resultOf(await api.createBucket(bucketName, { public: false, fileSizeLimit: maxBytes, allowedMimeTypes: mimeTypes }));
}

function bucket() {
    return storage().from(bucketName);
}

module.exports = { bucket, resultOf, prepareBucket, maxBytes, mimeTypes };
