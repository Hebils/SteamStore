document.getElementById('registro-form').addEventListener('submit', async (event) => {
    event.preventDefault();


    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById('mensaje');
    button.disabled = true;
    window.gamixApi.showMessage(message, 'Creando cuenta...');

    try {
        const result = await window.gamixApi.post('registro', {
            nombre: form.elements.nombre.value.trim(),
            email: form.elements.email.value.trim(),
            password: form.elements.password.value,
        });

        window.gamixApi.showMessage(message, `${result.message}. Ya puedes iniciar sesión.`);
        form.reset();
        setTimeout(function () { window.location.href = 'Login.html' }, 1000);
    } catch (error) {
        window.gamixApi.showMessage(message, error.message, true);
    } finally {
        button.disabled = false;
    }
});
