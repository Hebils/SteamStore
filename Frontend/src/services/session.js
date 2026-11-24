import { authService } from './authService.js';

export function loginUrl(path = location.pathname) {
    return `/login?next=${encodeURIComponent(path)}`;
}

export function handleSessionError(error) {
    if (error.status !== 401) return false;
    authService.clearSession();
    location.replace(loginUrl());
    return true;
}

export async function requireUser() {
    const user = await authService.validateSession();
    if (!user) {
        location.replace(loginUrl());
        return null;
    }
    return user;
}
