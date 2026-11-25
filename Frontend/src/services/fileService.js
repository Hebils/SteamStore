import { api } from './api.js';

// Se usa cuando el backend defina su ruta de carga de archivos.
export const fileService = {
    upload(endpoint, file, token, fieldName = 'file') {
        const data = new FormData();
        data.append(fieldName, file);
        return api.upload(endpoint, data, token);
    },

    getProfileImages(token) {
        return api.get('usuarios/me/imagenes', token);
    },

    uploadProfileImage(file, token) {
        return this.upload('usuarios/me/imagenes', file, token);
    },

    getMyFiles(token) {
        return api.get('usuarios/me/archivos', token);
    },

    getReviewImages(reviewId) {
        return api.get(`resenas/${reviewId}/imagenes`);
    },

    uploadReviewImage(reviewId, file, token) {
        return this.upload(`resenas/${reviewId}/imagenes`, file, token);
    },

    getGameImages(gameId) {
    return api.get(`games/${gameId}/imagenes`);
    },
    
    uploadGameImage(gameId, file, token) {
        return this.upload(`games/${gameId}/imagenes`, file, token);
    }
};
