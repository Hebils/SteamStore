const artStyles = ['art-one', 'art-two', 'art-three'];

export function createGameCard(game, index, { isAdmin = false, onEdit, onDelete } = {}) {
    const id = game.id;
    const title = game.titulo || game.title || game.nombre || `Juego ${id}`;
    const genre = game.genero || game.genre || game.categoria || 'Videojuego';
    const price = game.precio ?? game.price;

    const card = document.createElement('article');
    card.className = 'game-card';
    const link = document.createElement('a');
    link.className = 'game-card-link';
    link.href = `/games/${encodeURIComponent(id)}`;

    const art = document.createElement('div');
    art.className = `game-art ${artStyles[index % artStyles.length]}`;
    const tag = document.createElement('span');
    tag.textContent = `${String(index + 1).padStart(2, '0')} // ${genre}`;
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
    cost.textContent = price === undefined || price === null ? 'Precio no disponible' : `$${price}`;
    info.append(heading, category, cost);
    link.append(art, info);
    card.append(link);

    if (isAdmin) {
        const actions = document.createElement('div');
        actions.className = 'game-admin-actions';
        const editButton = document.createElement('button');
        editButton.className = 'terminal-button';
        editButton.type = 'button';
        editButton.textContent = './editar';
        editButton.addEventListener('click', () => onEdit(game));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'terminal-button danger';
        deleteButton.type = 'button';
        deleteButton.textContent = './eliminar';
        deleteButton.addEventListener('click', async () => {
            deleteButton.disabled = true;
            try {
                await onDelete(game);
            } finally {
                deleteButton.disabled = false;
            }
        });
        actions.append(editButton, deleteButton);
        card.append(actions);
    }

    return card;
}
