import { authService } from '../services/authService.js';
import { getCommerceState } from '../services/commerceState.js';
import { element, link } from './ui.js';

export function setupNavigation(user = authService.getSession()?.user || null) {
    const header = document.querySelector('.store-header');
    if (!header) return;
    const brand = link('GAMIX_', '/store', 'brand');
    brand.prepend(element('span', 'brand-symbol', '>_'));
    brand.setAttribute('aria-label', 'Gamix, ir a la tienda');
    const nav = element('nav', 'store-nav');
    nav.setAttribute('aria-label', 'Navegación principal');
    [
        ['Tienda', '/store'],
        ['Biblioteca', '/library'],
        ['Compras', '/purchases'],
        ['Carrito', '/cart']
    ].forEach(([label, href]) => {
        const item = link(label, href, href === '/cart' ? 'cart-link' : '');
        if (href === '/cart') {
            const count = element('span', 'cart-count', '—');
            count.dataset.cartCount = '';
            count.setAttribute('aria-label', 'Cantidad de juegos');
            item.append(count);
        }
        if (
            location.pathname === href ||
            (href === '/store' &&
                (location.pathname === '/' ||
                    location.pathname.startsWith('/games/')))
        ) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
        }
        nav.append(item);
    });
    const account = element('div', 'nav-account');
    if (user) {
        const profile = link(
            user.nombre || 'Mi perfil',
            '/profile',
            'nav-profile'
        );
        profile.setAttribute(
            'aria-label',
            `Mi perfil: ${user.nombre || 'usuario'}`
        );
        if (location.pathname === '/profile')
            profile.setAttribute('aria-current', 'page');
        const logout = element('button', 'nav-logout', 'Salir');
        logout.type = 'button';
        logout.addEventListener('click', authService.logout);
        account.append(profile, logout);
    } else {
        account.append(
            link('Iniciar sesión', '/login', ''),
            link('Crear cuenta', '/register', 'register')
        );
    }
    header.replaceChildren(brand, nav, account);
    updateCartCount();
}

function updateCartCount() {
    const state = getCommerceState();
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
        node.textContent =
            authService.getSession() && state.ready ? state.cart.length : '—';
    });
}

document.addEventListener('commerce:change', updateCartCount);
