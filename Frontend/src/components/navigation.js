import { authService } from '../services/authService.js';

export function setupNavigation(user = authService.getSession()?.user || null) {
    document.querySelectorAll('[data-auth-guest]').forEach((element) => {
        element.hidden = Boolean(user);
    });
    document.querySelectorAll('[data-auth-user]').forEach((element) => {
        element.hidden = !user;
    });
    document.querySelectorAll('[data-user-name]').forEach((element) => {
        element.textContent = user?.nombre || user?.email || 'usuario';
    });
    document.querySelectorAll('[data-logout]').forEach((button) => {
        if (button.dataset.bound) return;
        button.dataset.bound = 'true';
        button.addEventListener('click', authService.logout);
    });
}
