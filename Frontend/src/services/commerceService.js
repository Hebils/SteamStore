import { api, ApiError } from './api.js';
import { authService } from './authService.js';

function token() {
    const session = authService.getSession();
    if (!session)
        throw new ApiError(
            'Tu sesión terminó. Inicia sesión para continuar.',
            401
        );
    return session.token;
}

function list(result, key) {
    if (!Array.isArray(result?.[key]))
        throw new ApiError(
            'No pudimos leer tus datos. Intenta actualizar de nuevo.'
        );
    return result[key];
}

export const commerceService = {
    cart: async () => list(await api.get('cart', token()), 'items'),
    add: (id) =>
        api.put(`cart/items/${encodeURIComponent(id)}`, undefined, token()),
    remove: (id) => api.delete(`cart/items/${encodeURIComponent(id)}`, token()),
    library: async () => list(await api.get('library', token()), 'games'),
    history: async () => list(await api.get('purchases', token()), 'purchases'),
    async checkout() {
        const result = await api.post('purchases', undefined, token());
        if (!result?.purchase?.id || !Array.isArray(result.purchase.items))
            throw new ApiError(
                'No pudimos confirmar la respuesta de la compra.'
            );
        return result.purchase;
    }
};
