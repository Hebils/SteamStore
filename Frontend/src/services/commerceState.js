import { authService } from './authService.js';
import { commerceService } from './commerceService.js';

// Compartido por catálogo, carrito y biblioteca; admite futuras consultas de propiedad.
let state = { ready: false, cart: [], library: [] };
let request;
export function getCommerceState() {
    return state;
}

export function setCommerceState(cart, library) {
    state = { ready: true, cart, library };
    document.dispatchEvent(
        new CustomEvent('commerce:change', { detail: state })
    );
    return state;
}

export async function refreshCommerce() {
    if (!authService.getSession()) return state;
    if (request) return request;
    request = Promise.all([commerceService.cart(), commerceService.library()])
        .then(([cart, library]) => setCommerceState(cart, library))
        .finally(() => {
            request = null;
        });
    return request;
}
