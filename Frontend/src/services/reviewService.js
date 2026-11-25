
import { api } from './api.js';

export const reviewService = {
    // Consultar las reseñas de un videojuego.
    async getByGame(gameId) {
        const result = await api.get(`juegos/${gameId}/resenas`);
        return result.resenas || [];
    },

    // Crear una reseña.
    create(gameId, data, token) {
        return api.post(`juegos/${gameId}/resenas`, data, token);
    },

    // Actualizar una reseña propia.
    update(reviewId, data, token) {
        return api.put(`resenas/${reviewId}`, data, token);
    },

    // Eliminar una reseña propia.
    remove(reviewId, token) {
        return api.delete(`resenas/${reviewId}`, token);
    }
};
