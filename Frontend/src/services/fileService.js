import { api } from './api.js';

// Se usa cuando el backend defina su ruta de carga de archivos.
export const fileService = {
    upload(endpoint, file, token, fieldName = 'file') {
        const data = new FormData();
        data.append(fieldName, file);
        return api.upload(endpoint, data, token);
    }
};
