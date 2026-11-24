import { authService } from '../services/authService.js';
import { gameService } from '../services/gameService.js';
import { createGameCard } from '../components/gameCard.js';
import { setupNavigation } from '../components/navigation.js';
import { refreshCommerce } from '../services/commerceState.js';
import { confirmAction, emptyState, message } from '../components/ui.js';
import { ApiError } from '../services/api.js';

const list = document.getElementById('game-list');
const status = document.getElementById('catalog-status');
const retry = document.getElementById('retry-catalog');
const adminPanel = document.getElementById('admin-tools');
const gameForm = document.getElementById('game-form');
const adminMessage = document.getElementById('admin-message');
let games = [];
let isAdmin = false;
let loading = false;
const search = document.getElementById('catalog-search');
const refresh = document.getElementById('refresh-catalog');

function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
}

function showAdminMessage(message, isError = false) {
    adminMessage.textContent = message;
    adminMessage.classList.toggle('is-error', isError);
}

function renderGames() {
    const term = search.value.trim().toLocaleLowerCase('es');
    const filtered = games.filter((game) =>
        `${game.titulo} ${game.genero}`.toLocaleLowerCase('es').includes(term)
    );
    document.getElementById('clear-catalog-search').hidden = !search.value;
    list.replaceChildren(
        ...filtered.map((game, index) =>
            createGameCard(game, index, {
                isAdmin,
                onEdit: editGame,
                onDelete: deleteGame
            })
        )
    );
    showStatus(
        `${filtered.length} ${filtered.length === 1 ? 'juego disponible' : 'juegos disponibles'}${term ? ' para tu búsqueda' : ''}.`
    );
    if (!filtered.length) {
        const empty = emptyState(
            games.length
                ? 'No encontramos ese juego'
                : 'Nuevas aventuras en camino',
            games.length
                ? 'Prueba con otro título o género.'
                : 'Todavía no hay juegos publicados. Vuelve a consultar más tarde.',
            games.length ? 'Limpiar búsqueda' : 'Actualizar catálogo',
            '#catalogo'
        );
        empty.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            if (games.length) {
                search.value = '';
                renderGames();
                search.focus();
            } else loadGames();
        });
        list.append(empty);
    }
}

async function loadGames() {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    search.disabled = true;
    list.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    list.replaceChildren();
    showStatus('Cargando juegos…');
    try {
        games = await gameService.list();
        renderGames();
    } catch (error) {
        games = [];
        showStatus(
            error.status === 404
                ? 'El catálogo no está disponible en este momento. Intenta de nuevo.'
                : error.message || 'No se pudo cargar el catálogo.',
            true
        );
        retry.hidden = false;
    } finally {
        loading = false;
        refresh.disabled = false;
        search.disabled = false;
        list.setAttribute('aria-busy', 'false');
    }
}

function resetForm() {
    gameForm.reset();
    gameForm.elements.id.value = '';
    document.getElementById('game-form-title').textContent = 'Nuevo juego';
    document.getElementById('save-game').textContent = 'Crear juego';
    document.getElementById('cancel-game').textContent = 'Limpiar formulario';
}

function editGame(game) {
    gameForm.elements.id.value = game.id;
    gameForm.elements.titulo.value =
        game.titulo || game.title || game.nombre || '';
    gameForm.elements.descripcion.value =
        game.descripcion || game.description || '';
    gameForm.elements.genero.value = game.genero || game.genre || '';
    gameForm.elements.precio.value = game.precio ?? game.price ?? '';
    gameForm.elements.desarrollador.value =
        game.desarrollador || game.developer || '';
    gameForm.elements.fecha_lanzamiento.value = (
        game.fecha_lanzamiento ||
        game.releaseDate ||
        ''
    ).slice(0, 10);
    document.getElementById('game-form-title').textContent =
        `Editar juego #${game.id}`;
    document.getElementById('save-game').textContent = 'Guardar cambios';
    document.getElementById('cancel-game').textContent = 'Cancelar edición';
    gameForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    gameForm.elements.titulo.focus({ preventScroll: true });
}

function gameData() {
    return {
        titulo: gameForm.elements.titulo.value.trim(),
        descripcion: gameForm.elements.descripcion.value.trim(),
        genero: gameForm.elements.genero.value.trim(),
        precio: Number(gameForm.elements.precio.value),
        desarrollador: gameForm.elements.desarrollador.value.trim() || null,
        fecha_lanzamiento: gameForm.elements.fecha_lanzamiento.value || null
    };
}

async function confirmAdmin() {
    await authService.validateAdmin();
    const session = authService.getSession();
    if (!session)
        throw new ApiError('La sesión expiró. Vuelve a iniciar sesión.', 401);
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
    if (button.disabled) return;
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
        showAdminMessage(
            error.message ||
                'No se pudo guardar el juego. Tus datos siguen en el formulario.',
            true
        );
    } finally {
        button.disabled = false;
    }
}

async function deleteGame(game) {
    const name = game.titulo || game.title || game.nombre || `#${game.id}`;
    if (
        !(await confirmAction({
            title: `¿Retirar ${name}?`,
            description:
                'Dejará de aparecer en la tienda. Las compras previas y las bibliotecas conservarán el juego. Esta interfaz no permite volver a publicarlo.',
            confirm: 'Retirar de la tienda',
            danger: true
        }))
    )
        return;
    showAdminMessage(`Retirando ${name}…`);
    try {
        const currentToken = await confirmAdmin();
        await gameService.remove(game.id, currentToken);
        showAdminMessage('Juego retirado de la tienda.');
        await loadGames();
    } catch (error) {
        if (handleExpiredAdminSession(error)) return;
        showAdminMessage(
            error.message || 'No se pudo eliminar el juego.',
            true
        );
    }
}

async function initialize() {
    setupNavigation();
    isAdmin = false;
    adminPanel.hidden = true;
    const catalogTask = loadGames();
    let accountTask;
    const session = authService.getSession();
    if (session) {
        try {
            const user = await authService.validateSession();
            setupNavigation(user);
            accountTask = refreshCommerce().catch((error) => {
                if (error.status === 401) {
                    authService.clearSession();
                    setupNavigation(null);
                } else
                    message(
                        document.getElementById('account-status'),
                        'No pudimos actualizar tu carrito. Se comprobará de nuevo al añadir un juego.',
                        true
                    );
            });
            if (user?.rol === 'admin') {
                await authService.validateAdmin();
                isAdmin = true;
                adminPanel.hidden = false;
            }
        } catch (error) {
            if (error.status === 401) authService.clearSession();
            setupNavigation(authService.getSession()?.user || null);
            if (error.status !== 401)
                message(
                    document.getElementById('account-status'),
                    'No pudimos actualizar tu cuenta. Al añadir un juego comprobaremos de nuevo tu carrito.',
                    true
                );
        }
    }
    await catalogTask;
    await accountTask;
    if (isAdmin) renderGames();
}

document.getElementById('retry-catalog').addEventListener('click', loadGames);
document.getElementById('cancel-game').addEventListener('click', resetForm);
gameForm.addEventListener('submit', saveGame);
refresh.addEventListener('click', async () => {
    await loadGames();
    if (authService.getSession()) refreshCommerce().catch(() => {});
});
search.addEventListener('input', renderGames);
document
    .getElementById('clear-catalog-search')
    .addEventListener('click', () => {
        search.value = '';
        renderGames();
        search.focus();
    });
window.addEventListener('pageshow', (event) => {
    if (event.persisted) initialize();
});
initialize();
