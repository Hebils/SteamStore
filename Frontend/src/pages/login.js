import { authService } from '../services/authService.js';
import { setupPasswordToggle } from '../components/authForm.js';
setupPasswordToggle();
const next = authService.getSafeReturnPath();
document.querySelector('.auth-link a').href =
    `/register?next=${encodeURIComponent(next)}`;

const form = document.getElementById('login-form');
const message = document.getElementById('mensaje');
const registerNotice = document.getElementById('registro-notice');

if (new URLSearchParams(location.search).has('registered')) {
    registerNotice.textContent = 'Cuenta creada. Ya puedes iniciar sesión.';
    registerNotice.hidden = false;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    message.classList.remove('is-error');
    message.textContent = 'Conectando con el servidor...';

    try {
        const result = await authService.login({
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
        });
        message.textContent = `Acceso correcto. Bienvenido, ${result.usuario.nombre}.`;
        location.assign(next);
    } catch (error) {
        message.textContent = error.message || 'No se pudo iniciar sesión.';
        message.classList.add('is-error');
        button.disabled = false;
    }
});
