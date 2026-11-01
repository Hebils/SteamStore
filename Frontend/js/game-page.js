(() => {
    const status = document.getElementById('game-status');
    const content = document.getElementById('game-content');
    const retry = document.getElementById('retry-game');
    const gameId = window.location.pathname.match(/^\/games\/([a-zA-Z0-9_-]+)\/?$/)?.[1];
    document.getElementById('game-id').textContent = gameId || 'id invalido';

    function text(selector, value, fallback = 'No disponible') {
        document.querySelector(selector).textContent = value ?? fallback;
    }

    async function loadGame() {
        status.hidden = false;
        status.classList.remove('is-error');
        status.textContent = 'Cargando detalles del juego...';
        content.hidden = true;
        retry.hidden = true;

        if (!gameId) {
            status.textContent = 'La ruta del juego no contiene un identificador válido.';
            status.classList.add('is-error');
            return;
        }

        try {
            const result = await window.gamixApi.get(`games/${encodeURIComponent(gameId)}`);
            const game = result.game || result.juego || result.data || result;
            const title = game.title || game.titulo || game.nombre || `Juego ${gameId}`;
            document.title = `Gamix | ${title}`;
            text('#page-title', title);
            text('#game-title', title);
            text('#game-description', game.description || game.descripcion || 'Este juego todavía no tiene descripción.');
            text('#game-genre', game.genre || game.genero || game.categoria);
            text('#game-developer', game.developer || game.desarrollador);
            text('#game-price', game.price ?? game.precio, 'Precio no disponible');
            content.hidden = false;
            status.hidden = true;
        } catch (error) {
            status.textContent = error.status === 404
                ? 'El backend todavía no ofrece GET /api/games/:id para consultar este detalle.'
                : error.message || 'No se pudo cargar el videojuego.';
            status.classList.add('is-error');
            retry.hidden = false;
        }
    }

    retry.addEventListener('click', loadGame);
    document.addEventListener('DOMContentLoaded', () => {
        window.gamixAuth.applyNavigation(window.gamixAuth.getSession()?.user || null);
        loadGame();
    });
})();
