const API_ROOT = '/api';

export class ApiError extends Error {
    constructor(message, status = 0, body = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

async function request(path, { method = 'GET', data, token } = {}) {
    const headers = {};
    const isFormData =
        typeof FormData !== 'undefined' && data instanceof FormData;
    if (data !== undefined && !isFormData)
        headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_ROOT}/${path.replace(/^\//, '')}`, {
            method,
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
            body:
                data === undefined
                    ? undefined
                    : isFormData
                      ? data
                      : JSON.stringify(data)
        });
    } catch {
        throw new ApiError(
            'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
        );
    }

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => '');

    if (!response.ok) {
        let message =
            typeof body === 'object' && body?.message
                ? body.message
                : `La API respondió con el estado ${response.status}.`;
        if (response.status === 405) {
            message =
                'Esta acción no está disponible en este momento. Intenta de nuevo más tarde.';
        }
        throw new ApiError(message, response.status, body);
    }

    return body;
}

export const api = {
    get: (path, token) => request(path, { token }),
    post: (path, data, token) => request(path, { method: 'POST', data, token }),
    put: (path, data, token) => request(path, { method: 'PUT', data, token }),
    delete: (path, token) => request(path, { method: 'DELETE', token }),
    upload: (path, formData, token) =>
        request(path, { method: 'POST', data: formData, token })
};
