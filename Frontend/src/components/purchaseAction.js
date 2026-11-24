import { authService } from '../services/authService.js';
import { commerceService } from '../services/commerceService.js';
import {
    getCommerceState,
    refreshCommerce,
    setCommerceState
} from '../services/commerceState.js';
import { handleSessionError, loginUrl } from '../services/session.js';
import { element, message } from './ui.js';

function update(button) {
    if (button.dataset.busy) return;
    const state = getCommerceState();
    const id = button.dataset.purchaseId;
    const owned = state.library.some((game) => String(game.id) === id);
    const added = state.cart.some((game) => String(game.id) === id);
    button.textContent = owned
        ? 'Ver en mi biblioteca'
        : added
          ? 'Ver carrito'
          : 'Añadir al carrito';
    button.classList.toggle('is-owned', owned);
}

export function createPurchaseAction(game) {
    const group = element('div', 'purchase-action');
    const button = element('button', 'btn-primary');
    button.type = 'button';
    button.dataset.purchaseId = game.id;
    const feedback = element('p', 'action-feedback');
    feedback.setAttribute('role', 'status');
    feedback.hidden = true;
    update(button);
    button.addEventListener('click', async () => {
        if (button.dataset.busy) return;
        if (!authService.getSession()) {
            location.assign(loginUrl());
            return;
        }
        button.dataset.busy = 'true';
        button.disabled = true;
        button.textContent = 'Comprobando…';
        message(feedback, '');
        try {
            const state = await refreshCommerce();
            if (
                state.library.some(
                    (item) => String(item.id) === String(game.id)
                )
            ) {
                location.assign('/library');
                return;
            }
            if (
                state.cart.some((item) => String(item.id) === String(game.id))
            ) {
                location.assign('/cart');
                return;
            }
            await commerceService.add(game.id);
            const latest = getCommerceState();
            setCommerceState(
                [...latest.cart, { ...game, publicado: 1 }],
                latest.library
            );
            message(
                feedback,
                'Añadido. Puedes seguir explorando o abrir el carrito.'
            );
        } catch (error) {
            if (handleSessionError(error)) return;
            message(
                feedback,
                error.message ||
                    'No se pudo añadir el juego. Intenta de nuevo.',
                true
            );
            if (error.status === 409) {
                try {
                    await refreshCommerce();
                } catch {
                    /* El siguiente intento vuelve a comprobar el estado. */
                }
            }
        } finally {
            delete button.dataset.busy;
            button.disabled = false;
            update(button);
        }
    });
    group.append(button, feedback);
    return group;
}

document.addEventListener('commerce:change', () =>
    document.querySelectorAll('[data-purchase-id]').forEach(update)
);
