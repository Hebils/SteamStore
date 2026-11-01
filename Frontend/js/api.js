// API del backend, servida por el proxy local de Frontend/server.js.
window.gamixApi = {
    async request(path, { method = 'GET', data, token } = {}) {
        const headers = {};
        if (data !== undefined) headers['Content-Type'] = 'application/json';
        if (token) headers.Authorization = `Bearer ${token}`;

        let response;

        try {
            response = await fetch(`/api/${path}`, {
                method,
                headers,
                body: data === undefined ? undefined : JSON.stringify(data)
            });
        } catch {
            throw new Error('No se pudo conectar con el servidor. Verifica que esté encendido.');
        }

        const result = await response.json().catch(() => ({}));
        if (response.status === 405) {
            const error = new Error('Live Server no reenvía peticiones a la API. Ejecuta node Frontend/server.js y abre el puerto que indique la terminal (por defecto, http://127.0.0.1:5501).');
            error.status = 405;
            throw error;
        }
        if (response.status === 500) {
            const error = new Error('El backend tuvo un error. Revisa la configuración de la base de datos y SECRET_KEY en .env.');
            error.status = 500;
            throw error;
        }
        if (!response.ok) {
            const error = new Error(result.message || 'Ocurrió un error. Intenta de nuevo.');
            error.status = response.status;
            throw error;
        }
        return result;
    },

    get(path, token) {
        return this.request(path, { token });
    },

    post(path, data) {
        return this.request(path, { method: 'POST', data });
    },

    put(path, data, token) {
        return this.request(path, { method: 'PUT', data, token });
    },

    delete(path, token) {
        return this.request(path, { method: 'DELETE', token });
    },

    showMessage(element, message, isError = false) {
        element.textContent = message;
        element.classList.toggle('is-error', isError);
    }
};
