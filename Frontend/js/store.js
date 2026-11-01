(() => {
    const list = document.getElementById('game-list');
    const status = document.getElementById('catalog-status');
    const retry = document.getElementById('retry-catalog');
    const artStyles = ['art-one', 'art-two', 'art-three'];

    function showStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function gameCard(game, index) {
        const id = game.id;
        const title = game.title || game.titulo || game.nombre || `Juego ${id}`;
        const genre = game.genre || game.genero || game.categoria || 'Videojuego';
        const price = game.price ?? game.precio;
        const card = document.createElement('article');
        const link = document.createElement('a');
        const art = document.createElement('div');
        const tag = document.createElement('span');
        const artTitle = document.createElement('b');
        const info = document.createElement('div');
        const name = document.createElement('h3');
        const category = document.createElement('p');
        const cost = document.createElement('strong');

        card.className = 'game-card';
        link.className = 'game-card-link';
        link.href = `/games/${encodeURIComponent(id)}`;
        art.className = `game-art ${artStyles[index % artStyles.length]}`;
        tag.textContent = `${String(index + 1).padStart(2, '0')} // ${genre}`;
        artTitle.textContent = title;
        info.className = 'game-info';
        name.textContent = title;
        category.textContent = genre;
        cost.textContent = price === undefined || price === null ? 'Precio no disponible' : `$${price}`;

        art.append(tag, artTitle);
        info.append(name, category, cost);
        link.append(art, info);
        card.append(link);
        return card;
    }

    async function loadCatalog() {
        list.replaceChildren();
        retry.hidden = true;
        showStatus('Cargando catálogo...');

        try {
            const result = await window.gamixApi.get('games');
            const games = Array.isArray(result) ? result : result.games || result.juegos || result.videojuegos || result.data;
            if (!Array.isArray(games)) throw new Error('La respuesta del catálogo no tiene un formato válido.');
            if (games.length === 0) {
                showStatus('El catálogo todavía no tiene juegos publicados.');
                return;
            }

            list.replaceChildren(...games.map(gameCard));
            showStatus(`${games.length} juego(s) disponibles.`);
        } catch (error) {
            const endpointMissing = error.status === 404;
            showStatus(
                endpointMissing
                    ? 'El backend todavía no ofrece GET /api/games. El catálogo aparecerá cuando ese endpoint esté disponible.'
                    : error.message || 'No se pudo cargar el catálogo.',
                true
            );
            retry.hidden = false;
        }
    }

    retry.addEventListener('click', loadCatalog);
    document.addEventListener('DOMContentLoaded', () => {
        window.gamixAuth.applyNavigation(window.gamixAuth.getSession()?.user || null);
        loadCatalog();
    });
})();
