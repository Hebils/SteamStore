import { commerceService } from '../services/commerceService.js';
import { refreshCommerce } from '../services/commerceState.js';
import { requireUser, handleSessionError } from '../services/session.js';
import { setupNavigation } from '../components/navigation.js';
import { createGameCard } from '../components/gameCard.js';
import { element, message, money, date, emptyState } from '../components/ui.js';

const isLibrary = document.body.dataset.page === 'library';
const status = document.getElementById('route-status');
const content = document.getElementById('protected-content');
const list = document.getElementById('collection-list');
const search = document.getElementById('collection-search');
const retry = document.getElementById('retry-session');
const refresh = document.getElementById('refresh-collection');
let entries = [];
let loading = false;

function receipt(purchase) {
    const panel = element('article', 'purchase-receipt');
    panel.id = `purchase-${purchase.id}`;
    panel.tabIndex = -1;
    const header = element('div', 'receipt-header');
    const title = element('div');
    title.append(
        element('p', 'terminal-line', `~/ compras / ${purchase.id}`),
        element('h2', '', `Compra #${purchase.id}`),
        element('p', 'muted', date(purchase.fecha_compra))
    );
    const amount = element('div', 'receipt-amount');
    amount.append(
        element('span', 'badge', 'Completada · simulada'),
        element('strong', '', money(purchase.total))
    );
    header.append(title, amount);
    const details = element('details', 'receipt-details');
    details.open = true;
    details.append(
        element(
            'summary',
            '',
            `${purchase.items.length} ${purchase.items.length === 1 ? 'juego adquirido' : 'juegos adquiridos'} · ver detalle`
        )
    );
    const items = element('ul', 'receipt-items');
    purchase.items.forEach((game) => {
        const row = element('li');
        row.append(
            element('span', '', game.titulo || 'Juego adquirido'),
            element('strong', '', money(game.precio))
        );
        items.append(row);
    });
    details.append(items);
    panel.append(header, details);
    return panel;
}

function render() {
    const term = search.value.trim().toLocaleLowerCase('es');
    const filtered = entries.filter((entry) =>
        (isLibrary
            ? `${entry.titulo} ${entry.genero}`
            : `${entry.id} ${entry.items.map((game) => game.titulo).join(' ')}`
        )
            .toLocaleLowerCase('es')
            .includes(term)
    );
    list.replaceChildren();
    document.getElementById('collection-count').textContent =
        `${filtered.length} de ${entries.length} ${isLibrary ? 'juegos' : 'compras'}`;
    document.getElementById('clear-search').hidden = !search.value;
    if (!entries.length) {
        list.append(
            emptyState(
                isLibrary
                    ? 'Tu biblioteca está por comenzar'
                    : 'Aún no tienes compras',
                isLibrary
                    ? 'Cuando confirmes una compra, tus juegos aparecerán aquí.'
                    : 'Tus compras simuladas y sus comprobantes se guardarán en este espacio.'
            )
        );
        return;
    }
    if (!filtered.length) {
        const box = emptyState(
            'No encontramos coincidencias',
            'Prueba con otro título o limpia la búsqueda.',
            'Ver todos',
            '#'
        );
        box.querySelector('a').addEventListener('click', (event) => {
            event.preventDefault();
            clearSearch();
        });
        list.append(box);
        return;
    }
    filtered.forEach((entry, index) =>
        list.append(
            isLibrary
                ? createGameCard(entry, index, { library: true })
                : receipt(entry)
        )
    );
}

function clearSearch() {
    search.value = '';
    render();
    search.focus();
}

async function load() {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    content.hidden = true;
    retry.hidden = true;
    message(
        status,
        isLibrary ? 'Cargando tu biblioteca…' : 'Cargando tus compras…'
    );
    try {
        const user = await requireUser();
        if (!user) return;
        setupNavigation(user);
        // El contenido principal no depende de que el contador del carrito responda.
        entries = isLibrary
            ? await commerceService.library()
            : await commerceService.history();
        content.hidden = false;
        render();
        message(status, '');
        refreshCommerce().catch((error) => {
            handleSessionError(error);
        });
        if (!isLibrary && /^#purchase-\d+$/.test(location.hash))
            document.getElementById(location.hash.slice(1))?.focus();
    } catch (error) {
        if (!handleSessionError(error)) {
            message(status, error.message, true);
            retry.hidden = false;
        }
    } finally {
        loading = false;
        refresh.disabled = false;
    }
}

setupNavigation();
search.addEventListener('input', render);
document.getElementById('clear-search').addEventListener('click', clearSearch);
refresh.addEventListener('click', load);
retry.addEventListener('click', load);
window.addEventListener('pageshow', (event) => {
    if (event.persisted) load();
});
load();
