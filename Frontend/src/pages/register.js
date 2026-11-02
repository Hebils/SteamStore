import { authService } from '../services/authService.js';

const form = document.getElementById('registro-form');
const message = document.getElementById('mensaje');

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.classList.remove('is-error');
    message.textContent = 'Creando cuenta...';

    try {
        const result = await authService.register({
            nombre: form.elements.nombre.value.trim(),
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
        });
        message.textContent = result.message || 'Cuenta creada. Ya puedes iniciar sesión.';
        form.reset();
        setTimeout(() => location.assign('/login?registered=1'), 700);
    } catch (error) {
        message.textContent = error.message || 'No se pudo crear la cuenta.';
        message.classList.add('is-error');
    } finally {
        button.disabled = false;
    }
});
