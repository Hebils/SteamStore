import { authService } from '../services/authService.js';
import { setupPasswordToggle } from '../components/authForm.js';
setupPasswordToggle();
const next = authService.getSafeReturnPath();
document.querySelector('.auth-link a').href =
    `/login?next=${encodeURIComponent(next)}`;

const form = document.getElementById('registro-form');
const message = document.getElementById('mensaje');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    message.classList.remove('is-error');
    message.textContent = 'Creando cuenta...';

    try {
        const result = await authService.register({
            nombre: form.elements.nombre.value.trim(),
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
        });
        message.textContent =
            result.message || 'Cuenta creada. Ya puedes iniciar sesión.';
        form.reset();
        location.assign(`/login?registered=1&next=${encodeURIComponent(next)}`);
    } catch (error) {
        message.textContent = error.message || 'No se pudo crear la cuenta.';
        message.classList.add('is-error');
        button.disabled = false;
    }
});
