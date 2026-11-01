(() => {
    const tokenKey = 'gamixToken';
    const userKey = 'gamixUser';

    function clearSession() {
        sessionStorage.removeItem(tokenKey);
        sessionStorage.removeItem(userKey);
    }

    function getSession() {
        const token = sessionStorage.getItem(tokenKey);
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (!payload.exp || payload.exp * 1000 <= Date.now()) {
                clearSession();
                return null;
            }
            return { token, user: JSON.parse(sessionStorage.getItem(userKey) || '{}'), payload };
        } catch {
            clearSession();
            return null;
        }
    }

    function isSafeReturnPath(path) {
        return typeof path === 'string' && (
            /^\/(library|profile|purchases)\/?$/.test(path) ||
            path === '/store' ||
            /^\/games\/[a-zA-Z0-9_-]+\/?$/.test(path)
        );
    }

    function getReturnPath() {
        const requested = new URLSearchParams(window.location.search).get('next');
        return isSafeReturnPath(requested) ? requested : '/store';
    }

    function loginRedirect() {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.replace(`/login?next=${next}`);
    }

    function applyNavigation(user) {
        document.querySelectorAll('[data-auth-guest]').forEach((element) => {
            element.hidden = Boolean(user);
        });
        document.querySelectorAll('[data-auth-user]').forEach((element) => {
            element.hidden = !user;
        });
        document.querySelectorAll('[data-user-name]').forEach((element) => {
            element.textContent = user?.nombre || user?.email || 'usuario';
        });
        document.querySelectorAll('[data-logout]').forEach((button) => {
            if (button.dataset.bound) return;
            button.dataset.bound = 'true';
            button.addEventListener('click', () => {
                clearSession();
                window.location.assign('/store?logout=1');
            });
        });
    }

    async function requireSession() {
        const session = getSession();
        if (!session) {
            loginRedirect();
            return null;
        }

        try {
            const result = await window.gamixApi.get('usuarios/perfil', session.token);
            const user = { ...session.user, ...result.usuario };
            sessionStorage.setItem(userKey, JSON.stringify(user));
            applyNavigation(user);
            return user;
        } catch (error) {
            if (error.status === 401) {
                clearSession();
                loginRedirect();
                return null;
            }
            const message = document.getElementById('route-status');
            if (message) {
                message.textContent = error.message || 'No se pudo verificar la sesión. Intenta de nuevo.';
                message.classList.add('is-error');
            }
            return null;
        }
    }

    window.gamixAuth = {
        clearSession,
        getSession,
        getReturnPath,
        applyNavigation,
        requireSession
    };

    document.addEventListener('DOMContentLoaded', () => {
        applyNavigation(getSession()?.user || null);
    });
})();
