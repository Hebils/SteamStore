import { commerceService } from '../services/commerceService.js';
import {
    refreshCommerce,
    getCommerceState,
    setCommerceState
} from '../services/commerceState.js';
import { requireUser, handleSessionError } from '../services/session.js';
import { setupNavigation } from '../components/navigation.js';
import { fileService } from '../services/fileService.js';
import {
    element,
    link,
    message,
    money,
    total,
    emptyState,
    confirmAction
} from '../components/ui.js';

const status = document.getElementById('route-status');
const content = document.getElementById('protected-content');
const list = document.getElementById('cart-items');
const layout = document.getElementById('cart-layout');
const checkout = document.getElementById('checkout');
const retry = document.getElementById('retry-session');
const feedback = document.getElementById('cart-feedback');
const recovery = document.getElementById('recover-purchase');

let busy = false;
let pending = null;
let user;

function pendingKey() {
    return `gamixPendingPurchase:${user.id}`;
}

function savePending(value) {
    if (value) sessionStorage.setItem(pendingKey(), JSON.stringify(value));
    else sessionStorage.removeItem(pendingKey());
    pending = value;
}

function isBlocked(game, library) {
    return (
        !Number(game.publicado) ||
        library.some((owned) => String(owned.id) === String(game.id))
    );
}

function fingerprint(items) {
    return JSON.stringify(
        items
            .map((game) => [
                String(game.id),
                Number(game.precio),
                Number(game.publicado)
            ])
            .sort((a, b) => a[0].localeCompare(b[0]))
    );
}

function setBusy(value) {
    busy = value;
    list.setAttribute('aria-busy', String(value));

    content.querySelectorAll('button').forEach((button) => {
        button.disabled = value;
    });

    retry.disabled = value;
    document.getElementById('refresh-cart').disabled = value;
    recovery.disabled = value;

    if (!value) updateSummary();
}

function updateSummary() {
    const { cart, library } = getCommerceState();
    const blocked = cart.some((game) => isBlocked(game, library));

    document.getElementById('cart-count').textContent =
        `${cart.length} ${cart.length === 1 ? 'juego' : 'juegos'}`;

    document.getElementById('cart-total').textContent = money(total(cart));

    checkout.disabled = busy || Boolean(pending) || !cart.length || blocked;

    message(
        document.getElementById('cart-warning'),
        blocked
            ? 'Retira los juegos no disponibles o que ya tienes para continuar.'
            : '',
        true
    );

    recovery.hidden = !pending;

    list.querySelectorAll('button').forEach((button) => {
        button.disabled = busy || Boolean(pending);
    });

    feedback.querySelectorAll('button').forEach((button) => {
        button.disabled = busy || Boolean(pending);
    });
}

async function renderCart() {
    const { cart, library } = getCommerceState();

    list.replaceChildren();

    const empty = document.getElementById('cart-empty');
    empty.replaceChildren();

    layout.hidden = !cart.length;

    if (!cart.length) {
        empty.append(
            emptyState(
                'Tu próxima aventura empieza aquí',
                'Explora la tienda y añade los juegos que quieras a tu carrito.'
            )
        );
    }

    cart.forEach((game) => {
        const row = element('article', 'cart-item');

        // Espacio para la portada.
        const art = element('div', 'mini-cover', '>_');
        art.setAttribute('aria-hidden', 'true');

        const info = element('div', 'cart-item-info');
        const title = element('h2');

        title.append(
            Number(game.publicado)
                ? link(
                      game.titulo,
                      `/games/${encodeURIComponent(game.id)}`,
                      ''
                  )
                : element('span', '', game.titulo)
        );

        const owned = library.some(
            (item) => String(item.id) === String(game.id)
        );

        info.append(
            title,
            element(
                'p',
                isBlocked(game, library) ? 'badge warning' : 'muted',
                owned
                    ? 'Ya está en tu biblioteca'
                    : !Number(game.publicado)
                      ? 'Retirado de la tienda'
                      : 'Juego digital · una copia para tu cuenta'
            )
        );

        const remove = element(
            'button',
            'terminal-button danger',
            'Quitar'
        );

        remove.type = 'button';
        remove.setAttribute(
            'aria-label',
            `Quitar ${game.titulo} del carrito`
        );

        remove.addEventListener('click', () => removeGame(game));

        row.append(
            art,
            info,
            element('strong', 'item-price', money(game.precio)),
            remove
        );

        list.append(row);

        // Consultar la portada del juego.
        fileService
            .getGameImages(game.id)
            .then((result) => {
                const image = result.files?.find((file) => file.url);

                if (image?.url && row.isConnected) {
                    const img = document.createElement('img');

                    img.src = image.url;
                    img.alt = `Portada de ${game.titulo}`;
                    img.loading = 'lazy';

                    art.replaceChildren(img);
                    art.setAttribute('aria-hidden', 'false');
                }
            })
            .catch((error) => {
                console.error(
                    `No se pudo cargar la portada de ${game.titulo}:`,
                    error
                );
            });
    });

    updateSummary();
}

async function removeGame(game) {
    if (busy || pending) return;

    setBusy(true);
    message(feedback, `Quitando ${game.titulo}…`);

    try {
        await commerceService.remove(game.id);

        const current = getCommerceState();

        setCommerceState(
            current.cart.filter((item) => item.id !== game.id),
            current.library
        );

        await renderCart();

        message(feedback, `${game.titulo} se quitó del carrito.`);

        const undo = element('button', 'terminal-button', 'Deshacer');
        undo.type = 'button';

        undo.addEventListener('click', async () => {
            if (busy || pending) return;

            setBusy(true);
            undo.disabled = true;

            try {
                await commerceService.add(game.id);
                await refreshCommerce();
                await renderCart();

                message(feedback, `${game.titulo} volvió al carrito.`);
            } catch (error) {
                if (!handleSessionError(error)) {
                    message(feedback, error.message, true);
                }
            } finally {
                setBusy(false);
            }
        });

        feedback.append(' ', undo);
        undo.focus();
    } catch (error) {
        if (!handleSessionError(error)) {
            message(feedback, error.message, true);
        }
    } finally {
        setBusy(false);
    }
}

function showReceipt(purchase, recovered = false) {
    savePending(null);

    const receipt = document.getElementById('purchase-success');

    receipt.replaceChildren(
        element('p', 'terminal-line', '~/ compra completada'),
        element('h2', '', 'Tu biblioteca acaba de crecer'),
        element(
            'p',
            '',
            `${recovered ? 'Verificamos' : 'Registramos'} la compra #${purchase.id}. Total: ${money(purchase.total)}. No se realizó ningún cobro real.`
        )
    );

    const items = element('ul', 'receipt-items');

    purchase.items.forEach((game) => {
        const row = element('li');

        row.append(
            element('span', '', game.titulo),
            element('strong', '', money(game.precio))
        );

        items.append(row);
    });

    const actions = element('div', 'form-actions');

    actions.append(
        link('Abrir mi biblioteca', '/library', 'button'),
        link('Ver comprobante', `/purchases#purchase-${purchase.id}`)
    );

    receipt.append(items, actions);
    receipt.hidden = false;
    receipt.focus();

    message(feedback, '');
    recovery.hidden = true;

    document.getElementById('cart-empty').replaceChildren();
}

async function recoverPurchase() {
    if (busy || !pending) return;

    setBusy(true);

    message(
        feedback,
        'Consultando el historial y el carrito para verificar la compra…'
    );

    try {
        const [history] = await Promise.all([
            commerceService.history(),
            refreshCommerce()
        ]);

        const match = history.find(
            (purchase) =>
                !pending.previousIds.includes(String(purchase.id)) &&
                pending.gameIds.every((id) =>
                    purchase.items.some((game) => String(game.id) === id)
                )
        );

        await renderCart();

        if (match) {
            showReceipt(match, true);
        } else {
            savePending(null);

            message(
                feedback,
                'No encontramos una compra nueva de esta selección. Actualizamos tu carrito: revisa los juegos y el historial antes de confirmar de nuevo.'
            );

            feedback.append(' ', link('Ver historial', '/purchases'));
        }
    } catch (error) {
        if (!handleSessionError(error)) {
            message(
                feedback,
                'Todavía no podemos verificar el resultado. Revisa tu conexión y pulsa «Comprobar compra». No confirmes otra compra mientras tanto.',
                true
            );
        }
    } finally {
        setBusy(false);
    }
}

async function reviewPurchase() {
    if (busy || pending) return;

    setBusy(true);
    message(feedback, 'Actualizando los juegos y los precios…');

    let submitted = false;

    try {
        const [{ cart, library }, history] = await Promise.all([
            refreshCommerce(),
            commerceService.history()
        ]);

        await renderCart();

        if (!cart.length || cart.some((game) => isBlocked(game, library))) {
            message(
                feedback,
                'Tu carrito cambió. Revisa la selección antes de continuar.',
                true
            );
            return;
        }

        const snapshot = fingerprint(cart);

        message(feedback, '');

        const accepted = await confirmAction({
            title: 'Revisa tu compra',
            description:
                'Esta compra es simulada: no necesitas una tarjeta y no se hará ningún cobro. Los juegos se añadirán a tu biblioteca. El servidor confirma el precio final.',
            confirm: 'Confirmar compra simulada',
            items: cart,
            amount: total(cart)
        });

        if (!accepted) return;

        const latest = await refreshCommerce();

        await renderCart();

        if (
            snapshot !== fingerprint(latest.cart) ||
            latest.cart.some((game) => isBlocked(game, latest.library))
        ) {
            message(
                feedback,
                'Cambió el precio o la disponibilidad de un juego. Revisa el carrito y vuelve a confirmar.',
                true
            );
            return;
        }

        savePending({
            gameIds: cart.map((game) => String(game.id)),
            previousIds: history.map((purchase) => String(purchase.id))
        });

        message(feedback, 'Confirmando tu compra. Espera un momento…');

        submitted = true;

        const purchase = await commerceService.checkout();

        const state = getCommerceState();

        setCommerceState(
            [],
            [
                ...state.library,
                ...purchase.items.map((game) => ({
                    ...game,
                    fecha_adquisicion: new Date().toISOString()
                }))
            ]
        );

        await renderCart();
        showReceipt(purchase);
    } catch (error) {
        if (submitted && [400, 401, 403, 404, 409].includes(error.status)) {
            savePending(null);
        }

        if (handleSessionError(error)) return;

        message(
            feedback,
            pending
                ? 'Se interrumpió la respuesta. Tu compra podría haberse completado. Pulsa «Comprobar compra» para revisar el resultado antes de intentarlo otra vez.'
                : error.message ||
                      'No se pudo preparar la compra. Intenta actualizar el carrito.',
            true
        );
    } finally {
        setBusy(false);

        if (!submitted && !checkout.disabled) {
            checkout.focus();
        }
    }
}

async function load() {
    if (busy) return;

    setBusy(true);

    message(status, 'Cargando tu carrito…');

    content.hidden = true;
    retry.hidden = true;

    try {
        user = await requireUser();

        if (!user) return;

        setupNavigation(user);

        try {
            pending = JSON.parse(
                sessionStorage.getItem(pendingKey()) || 'null'
            );
        } catch {
            pending = null;
        }

        await refreshCommerce();
        await renderCart();

        content.hidden = false;
        message(status, '');

        if (pending) {
            message(
                feedback,
                'Hay una compra pendiente de verificación. Comprueba su resultado antes de continuar.',
                true
            );
        }
    } catch (error) {
        if (!handleSessionError(error)) {
            message(
                status,
                error.message || 'No se pudo cargar el carrito.',
                true
            );

            retry.hidden = false;
        }
    } finally {
        setBusy(false);
    }
}

setupNavigation();

checkout.addEventListener('click', reviewPurchase);
recovery.addEventListener('click', recoverPurchase);
retry.addEventListener('click', load);

document.getElementById('refresh-cart').addEventListener('click', load);

window.addEventListener('pageshow', (event) => {
    if (event.persisted) load();
});

load();
