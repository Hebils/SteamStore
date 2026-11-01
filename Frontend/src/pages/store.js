import { authService } from '../services/authService.js';
import { gameService } from '../services/gameService.js';
import { createGameCard } from '../components/gameCard.js';
import { setupNavigation } from '../components/navigation.js';

const list = document.getElementById('game-list');
const status = document.getElementById('catalog-status');
const retry = document.getElementById('retry-catalog');
const adminPanel = document.getElementById('admin-tools');
const gameForm = document.getElementById('game-form');
const adminMessage = document.getElementById('admin-message');
let games = [];
let isAdmin = false;

function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
}

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.classList.toggle('is-error', isError);
}

function renderGames() {
    list.replaceChildren(...games.map((game, index) => createGameCard(game, index, {
        isAdmin,
        onEdit: editGame,
        onDelete: deleteGame
    })));
}

async function loadGames() {
    retry.hidden = true;
    list.replaceChildren();
    showStatus('Cargando juegos desde GET /api/games...');
    try {
        games = await gameService.list();
        if (games.length === 0) {
            showStatus('El catálogo está vacío. Cuando haya juegos publicados, aparecerán aquí.');
            return;
        }
        renderGames();
        showStatus(`${games.length} juego(s) cargados desde la API.`);
    } catch (error) {
        games = [];
        showStatus(error.status === 404
            ? 'El backend todavía no define GET /api/games.'
            : error.message || 'No se pudo cargar el catálogo.', true);
        retry.hidden = false;
    }
}

function resetForm() {
    gameForm.reset();
    gameForm.elements.id.value = '';
    document.getElementById('game-form-title').textContent = 'Nuevo juego';
    document.getElementById('save-game').textContent = '$ crear-juego';
}

function editGame(game) {
    gameForm.elements.id.value = game.id;
    gameForm.elements.titulo.value = game.titulo || game.title || game.nombre || '';
    gameForm.elements.descripcion.value = game.descripcion || game.description || '';
    gameForm.elements.precio.value = game.precio ?? game.price ?? '';
    gameForm.elements.imagen.value = game.imagen || game.image || '';
    gameForm.elements.desarrollador.value = game.desarrollador || game.developer || '';
    gameForm.elements.fecha_lanzamiento.value = (game.fecha_lanzamiento || game.releaseDate || '').slice(0, 10);
    gameForm.elements.stock.value = game.stock ?? 0;
    document.getElementById('game-form-title').textContent = `Editar juego #${game.id}`;
    document.getElementById('save-game').textContent = '$ guardar-cambios';
    gameForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function gameData() {
    return {
        titulo: gameForm.elements.titulo.value.trim(),
        descripcion: gameForm.elements.descripcion.value.trim(),
        precio: Number(gameForm.elements.precio.value),
        imagen: gameForm.elements.imagen.value.trim() || null,
        desarrollador: gameForm.elements.desarrollador.value.trim() || null,
        fecha_lanzamiento: gameForm.elements.fecha_lanzamiento.value || null,
        stock: Number(gameForm.elements.stock.value)
    };
}

async function confirmAdmin() {
    await authService.validateAdmin();
    const session = authService.getSession();
    if (!session) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    return session.token;
}

function handleExpiredAdminSession(error) {
    if (error.status !== 401) return false;
    authService.clearSession();
    location.assign(`/login?next=${encodeURIComponent('/store')}`);
    return true;
}

async function saveGame(event) {
    event.preventDefault();
    const button = document.getElementById('save-game');
    button.disabled = true;
    showAdminMessage('Guardando juego...');
    try {
        const currentToken = await confirmAdmin();
        const id = gameForm.elements.id.value;
        if (id) await gameService.update(id, gameData(), currentToken);
        else await gameService.create(gameData(), currentToken);
        showAdminMessage(id ? 'Juego actualizado.' : 'Juego creado.');
        resetForm();
        await loadGames();
    } catch (error) {
        if (handleExpiredAdminSession(error)) return;
        showAdminMessage(error.message || 'No se pudo guardar el juego.', true);
    } finally {
        button.disabled = false;
    }
}

async function deleteGame(game) {
    const name = game.titulo || game.title || game.nombre || `#${game.id}`;
    if (!window.confirm(`¿Eliminar ${name}?`)) return;
    showAdminMessage(`Eliminando ${name}...`);
    try {
        const currentToken = await confirmAdmin();
        await gameService.remove(game.id, currentToken);
        showAdminMessage('Juego eliminado.');
        await loadGames();
    } catch (error) {
        if (handleExpiredAdminSession(error)) return;
        showAdminMessage(error.message || 'No se pudo eliminar el juego.', true);
    }
}

async function initialize() {
    setupNavigation();
    const session = authService.getSession();
    if (session) {
        try {
            const user = await authService.validateSession();
            setupNavigation(user);
            if (user?.rol === 'admin') {
                await authService.validateAdmin();
                isAdmin = true;
                adminPanel.hidden = false;
            }
        } catch (error) {
            if (error.status === 401) authService.clearSession();
            setupNavigation(authService.getSession()?.user || null);
        }
    }
    await loadGames();
}

document.getElementById('retry-catalog').addEventListener('click', loadGames);
document.getElementById('cancel-game').addEventListener('click', resetForm);
gameForm.addEventListener('submit', saveGame);
document.addEventListener('DOMContentLoaded', initialize);
