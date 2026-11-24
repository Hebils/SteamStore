const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// API aislada: ejecutamos las páginas reales sin modificar cuentas ni compras locales.
async function fixture(page, options = {}) {
    const user = {
        id: 17,
        nombre: 'Andrea',
        email: 'andrea@example.test',
        rol: options.admin ? 'admin' : 'usuario'
    };
    const token = `test.${Buffer.from(JSON.stringify({ id: user.id, exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url')}.test`;
    const model = {
        games: [
            {
                id: 1,
                titulo: 'Órbita de papel',
                genero: 'Aventura',
                precio: '12.50',
                publicado: 1,
                descripcion: 'Explora un universo de papel.',
                desarrollador: 'Gamix Studio',
                fecha_lanzamiento: '2026-10-20'
            },
            {
                id: 2,
                titulo: 'Circuito lunar',
                genero: 'Carreras',
                precio: '7.25',
                publicado: 1,
                descripcion: 'Corre entre las estrellas.'
            },
            {
                id: 3,
                titulo: 'Horizonte cero',
                genero: 'Exploración',
                precio: '0.00',
                publicado: 1
            }
        ],
        cart: options.cart || [],
        library: [],
        history: [],
        posts: 0,
        calls: [],
        failures: {},
        lostResponse: false
    };
    if (!options.guest)
        await page.addInitScript(
            ({ token, user }) => {
                if (!sessionStorage.getItem('fixture-seeded')) {
                    sessionStorage.setItem('gamixToken', token);
                    sessionStorage.setItem('gamixUser', JSON.stringify(user));
                    sessionStorage.setItem('fixture-seeded', '1');
                }
            },
            { token, user }
        );
    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace('/api/', '');
        const method = request.method();
        model.calls.push(`${method} ${path}`);
        const send = (body, status = 200) =>
            route.fulfill({ status, json: body });
        if (model.failures[path])
            return send(
                { message: 'No se pudo completar la solicitud.' },
                model.failures[path]
            );
        if (path === 'usuarios/login') return send({ usuario: user, token });
        if (path === 'usuarios/registro')
            return send({ message: 'Cuenta creada.' }, 201);
        if (path.startsWith('usuarios/')) return send({ usuario: user });
        if (path === 'games' && method === 'GET')
            return send({ games: model.games.filter((g) => g.publicado) });
        if (/^games\/\d+$/.test(path) && method === 'GET') {
            const game = model.games.find(
                (g) => g.id === Number(path.split('/')[1]) && g.publicado
            );
            return game
                ? send({ game })
                : send({ message: 'Juego no encontrado.' }, 404);
        }
        if (path.startsWith('games/') && method === 'PUT')
            return send({ message: 'Juego no encontrado.' }, 404);
        if (!request.headers().authorization)
            return send({ message: 'Inicia sesión.' }, 401);
        if (path === 'cart')
            return send({
                items: model.cart.map((id) =>
                    model.games.find((g) => g.id === id)
                )
            });
        if (path === 'library') return send({ games: model.library });
        if (path === 'purchases' && method === 'GET')
            return send({ purchases: model.history });
        if (path.startsWith('cart/items/')) {
            const id = Number(path.split('/')[2]);
            if (method === 'DELETE')
                model.cart = model.cart.filter((x) => x !== id);
            else if (!model.cart.includes(id)) model.cart.push(id);
            return route.fulfill({ status: 204 });
        }
        if (path === 'purchases' && method === 'POST') {
            model.posts++;
            expect(request.postData()).toBeNull();
            if (!model.cart.length)
                return send({ message: 'El carrito está vacío.' }, 409);
            const items = model.cart.map((id) => ({
                ...model.games.find((g) => g.id === id)
            }));
            const purchase = {
                id: 100 + model.posts,
                total: (
                    items.reduce(
                        (sum, g) => sum + Math.round(Number(g.precio) * 100),
                        0
                    ) / 100
                ).toFixed(2),
                items,
                fecha_compra: '2026-11-24T15:30:00Z'
            };
            model.history.unshift(purchase);
            model.library.push(
                ...items.map((g) => ({
                    ...g,
                    fecha_adquisicion: purchase.fecha_compra
                }))
            );
            model.cart = [];
            if (model.lostResponse) return route.abort('failed');
            return send({ purchase }, 201);
        }
        return send({ message: 'Ruta inesperada en la prueba.' }, 500);
    });
    return model;
}

test('catálogo, carrito, confirmación, biblioteca e historial', async ({
    page
}, testInfo) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const model = await fixture(page);
    await page.goto('/store');
    await page
        .getByRole('button', { name: 'Añadir al carrito' })
        .first()
        .click();
    await expect(page.locator('[data-cart-count]')).toHaveText('1');
    await page
        .getByRole('button', { name: 'Ver carrito', exact: true })
        .click();
    await expect(page.locator('#cart-total')).toHaveText('$ 12,50');
    await page.getByRole('button', { name: 'Revisar compra' }).click();
    await expect(page.getByRole('dialog')).toContainText('Órbita de papel');
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    expect(model.posts).toBe(0);
    await page.getByRole('button', { name: 'Revisar compra' }).click();
    await page
        .getByRole('button', { name: 'Confirmar compra simulada' })
        .click();
    await expect(page.locator('#purchase-success')).toContainText(
        'Compra #101',
        { ignoreCase: true }
    );
    expect(model.posts).toBe(1);
    await expect(page.locator('[data-cart-count]')).toHaveText('0');
    await page.getByRole('link', { name: 'Abrir mi biblioteca' }).click();
    await expect(page.locator('#collection-list')).toContainText(
        'Órbita de papel'
    );
    await page.screenshot({
        path: testInfo.outputPath('library.png'),
        fullPage: true
    });
    await page.getByRole('link', { name: 'Compras', exact: true }).click();
    await expect(page.locator('#purchase-101')).toContainText('$ 12,50');
    await page.screenshot({
        path: testInfo.outputPath('purchases.png'),
        fullPage: true
    });
    await page.reload();
    await expect(page.locator('#purchase-101')).toContainText(
        'Órbita de papel'
    );
    expect(errors).toEqual([]);
});

test('quitar y deshacer actualiza el total y el contador', async ({ page }) => {
    await fixture(page, { cart: [1, 2] });
    await page.goto('/cart');
    await expect(page.locator('#cart-total')).toHaveText('$ 19,75');
    await page
        .getByRole('button', { name: 'Quitar Órbita de papel del carrito' })
        .click();
    await expect(page.locator('#cart-total')).toHaveText('$ 7,25');
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await expect(page.locator('#cart-total')).toHaveText('$ 19,75');
    await expect(page.locator('[data-cart-count]')).toHaveText('2');
});

test('respuesta perdida se recupera sin repetir la compra, incluso al recargar', async ({
    page
}) => {
    const model = await fixture(page, { cart: [1] });
    model.lostResponse = true;
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Revisar compra' }).click();
    await page
        .getByRole('button', { name: 'Confirmar compra simulada' })
        .click();
    await expect(page.locator('#recover-purchase')).toBeVisible();
    await page.reload();
    model.failures.purchases = 503;
    await page.getByRole('button', { name: 'Comprobar compra' }).click();
    await expect(page.locator('#cart-feedback')).toContainText(
        'Todavía no podemos verificar'
    );
    delete model.failures.purchases;
    await page.getByRole('button', { name: 'Comprobar compra' }).click();
    await expect(page.locator('#purchase-success')).toContainText(
        'Verificamos'
    );
    expect(model.posts).toBe(1);
});

test('si cambia el precio mientras se confirma, solicita una revisión nueva', async ({
    page
}) => {
    const model = await fixture(page, { cart: [1] });
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Revisar compra' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    model.games[0].precio = '20.00';
    await page
        .getByRole('button', { name: 'Confirmar compra simulada' })
        .click();
    await expect(page.locator('#cart-feedback')).toContainText(
        'Cambió el precio'
    );
    await expect(page.locator('#cart-total')).toHaveText('$ 20,00');
    expect(model.posts).toBe(0);
});

test('juegos retirados y adquiridos bloquean compra y permanecen en biblioteca', async ({
    page
}) => {
    const model = await fixture(page, { cart: [1, 2] });
    model.games[0].publicado = 0;
    model.library = model.games
        .slice(0, 2)
        .map((g) => ({ ...g, fecha_adquisicion: '2026-11-24T15:00:00Z' }));
    await page.goto('/cart');
    await expect(page.locator('#checkout')).toBeDisabled();
    await expect(page.locator('#cart-warning')).toBeVisible();
    await page.goto('/library');
    await expect(page.locator('#collection-list')).toContainText(
        'Retirado de la tienda'
    );
    await expect(page.locator('a[href="/games/1"]')).toHaveCount(0);
    await page.getByLabel('Buscar en mi biblioteca').fill('circuito');
    await expect(page.locator('.game-card')).toHaveCount(1);
});

test('invitado vuelve al carrito tras iniciar sesión y puede cerrar sesión', async ({
    page
}) => {
    await fixture(page, { guest: true });
    await page.goto('/cart');
    await expect(page).toHaveURL(/login\?next=%2Fcart/);
    await page.getByLabel('Correo electrónico').fill('andrea@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('password123');
    await page
        .getByRole('button', { name: 'Iniciar sesión', exact: true })
        .click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator('#cart-empty')).toContainText(
        'Tu próxima aventura'
    );
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(
        page.getByRole('link', { name: 'Iniciar sesión' })
    ).toBeVisible();
});

test('sesión revocada redirige al inicio de sesión', async ({ page }) => {
    const model = await fixture(page, { cart: [1] });
    model.failures['usuarios/perfil'] = 401;
    await page.goto('/library');
    await expect(page).toHaveURL(/login\?next=%2Flibrary/);
});

test('errores de carga permiten reintentar y se distinguen de una colección vacía', async ({
    page
}) => {
    const model = await fixture(page);
    model.failures.purchases = 500;
    await page.goto('/purchases');
    await expect(page.locator('#retry-session')).toBeVisible();
    await expect(page.locator('#protected-content')).toBeHidden();
    delete model.failures.purchases;
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.locator('#collection-list')).toContainText(
        'Aún no tienes compras'
    );
});

test('administrador conserva datos del formulario ante un juego inexistente', async ({
    page
}) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await fixture(page, { admin: true });
    await page.goto('/store');
    await page
        .getByRole('button', { name: 'Editar', exact: true })
        .first()
        .click();
    await page.getByLabel('Título', { exact: true }).fill('Título actualizado');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.locator('#admin-message')).toHaveText(
        'Juego no encontrado.'
    );
    await expect(page.getByLabel('Título', { exact: true })).toHaveValue(
        'Título actualizado'
    );
    expect(errors).toEqual([]);
});

test('navegación, estructura y ausencia de desbordamiento', async ({
    page
}, testInfo) => {
    await fixture(page, { cart: [1, 2] });
    for (const route of [
        '/store',
        '/games/1',
        '/cart',
        '/library',
        '/purchases',
        '/profile',
        '/login',
        '/register'
    ]) {
        await page.goto(route);
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('main')).toHaveCount(1);
        await expect(page.locator('html')).toHaveAttribute('lang', 'es');
        await expect
            .poll(() =>
                page.evaluate(
                    () => document.documentElement.scrollWidth <= innerWidth
                )
            )
            .toBe(true);
        if (route === '/cart') {
            await expect(page.locator('#cart-items article')).toHaveCount(2);
            await page.screenshot({
                path: testInfo.outputPath('cart.png'),
                fullPage: true
            });
        }
        if (route === '/store') {
            await expect(page.locator('.game-card')).toHaveCount(3);
            await page.screenshot({
                path: testInfo.outputPath('store.png'),
                fullPage: true
            });
        }
    }
});

test('diálogo operable con teclado y compra de precio cero sin envíos repetidos', async ({
    page
}) => {
    const model = await fixture(page, { cart: [3] });
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Revisar compra' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Volver', exact: true })
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#checkout')).toBeFocused();
    await page.locator('#checkout').dblclick();
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page
        .getByRole('button', { name: 'Confirmar compra simulada' })
        .click();
    await expect(page.locator('#purchase-success')).toContainText('$ 0,00');
    expect(model.posts).toBe(1);
});

test('accesibilidad automatizada de las páginas y la confirmación', async ({
    page
}) => {
    await fixture(page, { cart: [1] });
    for (const route of [
        '/store',
        '/games/1',
        '/cart',
        '/library',
        '/purchases',
        '/profile',
        '/login',
        '/register'
    ]) {
        await page.goto(route);
        if (route === '/store')
            await expect(page.locator('.game-card')).toHaveCount(3);
        else if (route === '/games/1')
            await expect(page.locator('#game-content')).toBeVisible();
        else if (!['/login', '/register'].includes(route))
            await expect(page.locator('#protected-content')).toBeVisible();
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(
            results.violations,
            `${route}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`
        ).toEqual([]);
    }
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Revisar compra' }).click();
    const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
    expect(result.violations).toEqual([]);
});
