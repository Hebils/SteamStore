// API del backend, servida por el proxy local de Frontend/server.js.
window.gamixApi = {
    async post(path, data) {
        let response;

        try {
            response = await fetch(`/api/usuarios/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch {
            throw new Error('No se pudo conectar con el servidor. Verifica que esté encendido.');
        }

        const result = await response.json().catch(() => ({}));
        if (response.status === 405) {
            throw new Error('Live Server no reenvía peticiones a la API. Ejecuta node Frontend/server.js y abre el puerto que indique la terminal (por defecto, http://127.0.0.1:5501).');
        }
        if (response.status === 500) {
            throw new Error('El backend tuvo un error. Revisa la configuración de la base de datos y SECRET_KEY en .env.');
        }
        if (!response.ok) throw new Error(result.message || 'Ocurrió un error. Intenta de nuevo.');
        return result;
    },

    showMessage(element, message, isError = false) {
        element.textContent = message;
        element.classList.toggle('is-error', isError);
    }
};
