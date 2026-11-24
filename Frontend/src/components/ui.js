// Los datos de la API siempre se insertan como texto, nunca como HTML.
export function element(tag, className = '', text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function link(text, href, className = 'terminal-button') {
    const node = element('a', className, text);
    node.href = href;
    return node;
}

// La API no declara una divisa; conservamos $ sin inventar COP/USD.
export function money(value) {
    if (value == null || !Number.isFinite(Number(value)))
        return 'Precio no disponible';
    return `$ ${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}`;
}

export function date(value, dateOnly = false) {
    if (!value) return 'Fecha no disponible';
    const parsed = new Date(
        dateOnly ? `${String(value).slice(0, 10)}T12:00:00` : value
    );
    if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        ...(dateOnly ? {} : { timeStyle: 'short' })
    }).format(parsed);
}

export function total(items) {
    return (
        items.reduce(
            (sum, item) => sum + Math.round(Number(item.precio) * 100),
            0
        ) / 100
    );
}

export function message(node, text, isError = false) {
    node.textContent = text;
    node.hidden = !text;
    node.classList.toggle('is-error', isError);
}

export function emptyState(
    title,
    description,
    action = 'Explorar juegos',
    href = '/store'
) {
    const box = element('div', 'empty-state');
    box.append(
        element('span', 'terminal-line', '~/ sin elementos'),
        element('h2', '', title),
        element('p', '', description),
        link(action, href, 'button')
    );
    return box;
}

export function confirmAction({
    title,
    description,
    confirm = 'Confirmar',
    items = [],
    amount,
    danger = false
}) {
    return new Promise((resolve) => {
        const previous = document.activeElement;
        const dialog = element('dialog', 'confirm-dialog');
        dialog.setAttribute('aria-labelledby', 'confirm-title');
        dialog.setAttribute('aria-describedby', 'confirm-description');
        const heading = element('h2', '', title);
        heading.id = 'confirm-title';
        const copy = element('p', '', description);
        copy.id = 'confirm-description';
        dialog.append(
            element('p', 'terminal-line', '~/ confirmar'),
            heading,
            copy
        );
        if (items.length) {
            const list = element('ul', 'receipt-items');
            items.forEach((item) => {
                const row = element('li');
                row.append(
                    element('span', '', item.titulo),
                    element('strong', '', money(item.precio))
                );
                list.append(row);
            });
            dialog.append(
                list,
                element(
                    'p',
                    'summary-total',
                    `Total estimado: ${money(amount)}`
                )
            );
        }
        const actions = element('div', 'form-actions');
        const cancel = element('button', 'terminal-button', 'Volver');
        const accept = element(
            'button',
            danger ? 'terminal-button danger' : 'btn-primary',
            confirm
        );
        cancel.type = accept.type = 'button';
        cancel.autofocus = true;
        cancel.addEventListener('click', () => dialog.close('cancel'));
        accept.addEventListener('click', () => dialog.close('confirm'));
        dialog.addEventListener(
            'close',
            () => {
                const accepted = dialog.returnValue === 'confirm';
                dialog.remove();
                if (previous?.isConnected) previous.focus();
                resolve(accepted);
            },
            { once: true }
        );
        actions.append(cancel, accept);
        dialog.append(actions);
        document.body.append(dialog);
        dialog.showModal();
    });
}
