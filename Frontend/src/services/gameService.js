import { api } from './api.js';

function listFrom(result) {
    const games = Array.isArray(result)
        ? result
        : result?.games || result?.juegos || result?.videojuegos || result?.data;
    if (!Array.isArray(games)) throw new Error('La API devolvió un catálogo con formato inválido.');
    return games;
}

export const gameService = {
    async list() {
        const games = listFrom(await api.get('games'));
        if (games.some((game) => !game || game.id === undefined || game.id === null)) {
            throw new Error('Uno o más juegos de la API no tienen identificador.');
        }
        return games;
    },

    async get(id) {
        const result = await api.get(`games/${encodeURIComponent(id)}`);
        return result?.game || result?.juego || result?.data || result;
    },

    create(data, token) {
        return api.post('games', data, token);
    },

    update(id, data, token) {
        return api.put(`games/${encodeURIComponent(id)}`, data, token);
    },

    remove(id, token) {
        return api.delete(`games/${encodeURIComponent(id)}`, token);
    }
};
