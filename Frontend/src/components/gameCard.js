import { money, date, element, link as makeLink } from './ui.js';
import { createPurchaseAction } from './purchaseAction.js';
const artStyles = ['art-one', 'art-two', 'art-three'];

export function createGameCard(
    game,
    index,
    { isAdmin = false, onEdit, onDelete, library = false } = {}
) {
    const id = game.id;
    const title = game.titulo || game.title || game.nombre || `Juego ${id}`;
    const genre = game.genero || game.genre || game.categoria || 'Videojuego';
    const price = game.precio ?? game.price;

    const card = document.createElement('article');
    card.className = 'game-card';
    const available = !library || Boolean(Number(game.publicado));
    const link = document.createElement(available ? 'a' : 'div');
    link.className = 'game-card-link';
    if (available) link.href = `/games/${encodeURIComponent(id)}`;

    const art = document.createElement('div');
    art.className = `game-art ${artStyles[index % artStyles.length]}`;
    const tag = document.createElement('span');
    tag.textContent = `// ${genre}`;
    const artTitle = document.createElement('b');
    artTitle.textContent = title;
    art.append(tag, artTitle);

    const info = document.createElement('div');
    info.className = 'game-info';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const category = document.createElement('p');
    category.textContent = genre;
    const cost = document.createElement('strong');
    cost.textContent = library ? 'En tu biblioteca' : money(price);
    info.append(heading, category, cost);
    link.append(art, info);
    card.append(link);

    if (library) {
        const details = element('div', 'library-card-meta');
        details.append(
            element('p', '', `Adquirido el ${date(game.fecha_adquisicion)}`)
        );
        details.append(
            available
                ? makeLink('Ver juego', `/games/${encodeURIComponent(id)}`)
                : element(
                      'p',
                      'badge',
                      'Retirado de la tienda · sigue siendo tuyo'
                  )
        );
        card.append(details);
    } else {
        card.append(createPurchaseAction(game));
    }

    if (isAdmin) {
        const actions = document.createElement('div');
        actions.className = 'game-admin-actions';
        const editButton = document.createElement('button');
        editButton.className = 'terminal-button';
        editButton.type = 'button';
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', () => onEdit(game));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'terminal-button danger';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Retirar';
        deleteButton.addEventListener('click', async () => {
            deleteButton.disabled = true;
            try {
                await onDelete(game);
            } finally {
                deleteButton.disabled = false;
                if (deleteButton.isConnected) deleteButton.focus();
            }
        });
        actions.append(editButton, deleteButton);
        card.append(actions);
    }

    return card;
}
