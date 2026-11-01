import { gameService } from '../services/gameService.js';
import { authService } from '../services/authService.js';
import { setupNavigation } from '../components/navigation.js';

const status = document.getElementById('game-status');
const content = document.getElementById('game-content');
const retry = document.getElementById('retry-game');
const gameId = location.pathname.match(/^\/games\/([a-zA-Z0-9_-]+)\/?$/)?.[1];
document.getElementById('game-id').textContent = gameId || 'id inválido';

function setText(selector, value, fallback = 'No disponible') {
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
        const game = await gameService.get(gameId);
        const title = game.titulo || game.title || game.nombre || `Juego ${gameId}`;
        document.title = `Gamix | ${title}`;
        setText('#page-title', title);
        setText('#game-title', title);
        setText('#game-description', game.descripcion || game.description, 'Este juego todavía no tiene descripción.');
        setText('#game-genre', game.genero || game.genre || game.categoria);
        setText('#game-developer', game.desarrollador || game.developer);
        setText('#game-price', game.precio ?? game.price, 'Precio no disponible');
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

setupNavigation(authService.getSession()?.user || null);
retry.addEventListener('click', loadGame);
loadGame();
