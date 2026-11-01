import { authService } from '../services/authService.js';
import { setupNavigation } from '../components/navigation.js';

const status = document.getElementById('route-status');
const content = document.getElementById('protected-content');
const retry = document.getElementById('retry-session');

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'G';
}

function showProfile(user) {
    const values = {
        '[data-profile-name]': user.nombre || 'No disponible',
        '[data-profile-email]': user.email || 'No disponible',
        '[data-profile-role]': user.rol || 'usuario',
        '[data-profile-id]': user.id ?? 'No disponible'
    };
    Object.entries(values).forEach(([selector, value]) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    });
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = initials(user.nombre || user.email);
}

async function loadPrivatePage() {
    status.hidden = false;
    status.classList.remove('is-error');
    status.textContent = 'Verificando JWT con el servidor...';
    retry.hidden = true;
    content.hidden = true;

    const session = authService.getSession();
    if (!session) {
        const next = encodeURIComponent(`${location.pathname}${location.search}`);
        location.replace(`/login?next=${next}`);
        return;
    }

    try {
        const user = await authService.validateSession();
        setupNavigation(user);
        if (document.body.dataset.page === 'profile') showProfile(user);
        status.hidden = true;
        content.hidden = false;
    } catch (error) {
        if (error.status === 401) {
            authService.clearSession();
            const next = encodeURIComponent(`${location.pathname}${location.search}`);
            location.replace(`/login?next=${next}`);
            return;
        }
        status.textContent = error.message || 'No se pudo verificar la sesión. Intenta de nuevo.';
        status.classList.add('is-error');
        retry.hidden = false;
    }
}

setupNavigation();
retry.addEventListener('click', loadPrivatePage);
loadPrivatePage();
window.addEventListener('pageshow', (event) => {
    if (event.persisted) loadPrivatePage();
});
