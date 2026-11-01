import { api } from './api.js';

const TOKEN_KEY = 'gamixToken';
const USER_KEY = 'gamixUser';

function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

function getSession() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
        const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
        const payload = JSON.parse(atob(paddedPayload));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
            clearSession();
            return null;
        }
        return { token, user: JSON.parse(sessionStorage.getItem(USER_KEY) || '{}'), payload };
    } catch {
        clearSession();
        return null;
    }
}

function getSafeReturnPath() {
    const requested = new URLSearchParams(location.search).get('next');
    const valid = requested && (
        /^\/(library|profile|purchases)\/?$/.test(requested) ||
        requested === '/store' ||
        /^\/games\/[a-zA-Z0-9_-]+\/?$/.test(requested)
    );
    return valid ? requested : '/store';
}

export const authService = {
    getSession,
    clearSession,
    getSafeReturnPath,

    async login(credentials) {
        const result = await api.post('usuarios/login', credentials);
        sessionStorage.setItem(TOKEN_KEY, result.token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(result.usuario));
        return result;
    },

    register: (userData) => api.post('usuarios/registro', userData),

    async validateSession() {
        const session = getSession();
        if (!session) return null;
        try {
            const result = await api.get('usuarios/perfil', session.token);
            const user = { ...session.user, ...result.usuario };
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            if (error.status === 401) clearSession();
            throw error;
        }
    },

    validateAdmin: () => {
        const session = getSession();
        if (!session) return Promise.reject(new Error('Inicia sesión para continuar.'));
        return api.get('usuarios/admin', session.token);
    },

    logout() {
        clearSession();
        location.assign('/store?logout=1');
    }
};
