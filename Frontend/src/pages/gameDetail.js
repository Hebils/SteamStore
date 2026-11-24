import { gameService } from '../services/gameService.js';
import { authService } from '../services/authService.js';
import { setupNavigation } from '../components/navigation.js';
import { refreshCommerce } from '../services/commerceState.js';
import { createPurchaseAction } from '../components/purchaseAction.js';
import { money, date, message } from '../components/ui.js';

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
        status.textContent =
            'La ruta del juego no contiene un identificador válido.';
        status.classList.add('is-error');
        return;
    }

    try {
        const game = await gameService.get(gameId);
        const title =
            game.titulo || game.title || game.nombre || `Juego ${gameId}`;
        document.title = `Gamix | ${title}`;
        setText('#page-title', title);
        setText('#game-title', title);
        setText(
            '#game-description',
            game.descripcion || game.description,
            'Este juego todavía no tiene descripción.'
        );
        setText('#game-genre', game.genero || game.genre || game.categoria);
        setText('#game-developer', game.desarrollador || game.developer);
        setText('#game-price', money(game.precio ?? game.price));
        setText('#game-release', date(game.fecha_lanzamiento, true));
        document
            .getElementById('purchase-actions')
            .replaceChildren(createPurchaseAction(game));
        content.hidden = false;
        status.hidden = true;
    } catch (error) {
        status.textContent =
            error.status === 404
                ? 'Este juego no existe o fue retirado de la tienda. Puedes explorar otros juegos en el catálogo.'
                : error.message || 'No se pudo cargar el videojuego.';
        status.classList.add('is-error');
        retry.hidden = false;
    }
}

setupNavigation(authService.getSession()?.user || null);
async function loadAccount() {
    if (!authService.getSession()) return;
    try {
        const user = await authService.validateSession();
        setupNavigation(user);
        await refreshCommerce();
    } catch (error) {
        if (error.status === 401) {
            authService.clearSession();
            setupNavigation(null);
        } else
            message(
                document.getElementById('account-status'),
                'No pudimos actualizar tu cuenta. Se comprobará de nuevo al añadir el juego.',
                true
            );
    }
}
retry.addEventListener('click', loadGame);
loadGame();
loadAccount();
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        loadGame();
        loadAccount();
    }
});
