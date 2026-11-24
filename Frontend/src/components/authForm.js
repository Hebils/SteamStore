export function setupPasswordToggle() {
    const toggle = document.querySelector('.password-toggle');
    const input = document.getElementById('password');
    toggle?.addEventListener('click', () => {
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        toggle.textContent = visible
            ? 'Ocultar contraseña'
            : 'Mostrar contraseña';
        toggle.setAttribute('aria-pressed', String(visible));
    });
}
