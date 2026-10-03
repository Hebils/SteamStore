document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('mensaje');
    button.disabled = true;
    window.gamixApi.showMessage(message, 'Conectando con el servidor...');

    try {
        const result = await window.gamixApi.post('login', {
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
        });

        sessionStorage.setItem('gamixToken', result.token);
        sessionStorage.setItem('gamixUser', JSON.stringify(result.usuario));
        window.gamixApi.showMessage(message, `Acceso correcto. Bienvenido, ${result.usuario.nombre}.`);
        setTimeout(function () { window.location.href = 'index.html' }, 1000);
    } catch (error) {
        window.gamixApi.showMessage(message, error.message, true);
    } finally {
        button.disabled = false;
    }


});
