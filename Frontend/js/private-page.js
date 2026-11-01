(() => {
    const status = document.getElementById('route-status');
    const content = document.getElementById('protected-content');
    const retry = document.getElementById('retry-session');

    function initials(name = '') {
        return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'G';
    }

    function fillProfile(user) {
        const fields = {
            '[data-profile-name]': user.nombre || 'No disponible',
            '[data-profile-email]': user.email || 'No disponible',
            '[data-profile-role]': user.rol || 'usuario',
            '[data-profile-id]': user.id ?? 'No disponible'
        };
        Object.entries(fields).forEach(([selector, value]) => {
            const field = document.querySelector(selector);
            if (field) field.textContent = value;
        });
        const avatar = document.getElementById('profile-avatar');
        if (avatar) avatar.textContent = initials(user.nombre || user.email);
    }

    async function loadPrivatePage() {
        status.hidden = false;
        status.classList.remove('is-error');
        status.textContent = 'Verificando JWT con el servidor...';
        retry.hidden = true;
        content.hidden = true;

        const user = await window.gamixAuth.requireSession();
        if (!user) {
            if (status.classList.contains('is-error')) retry.hidden = false;
            return;
        }

        if (document.body.dataset.page === 'profile') fillProfile(user);
        status.hidden = true;
        content.hidden = false;
    }

    retry.addEventListener('click', loadPrivatePage);
    loadPrivatePage();
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) loadPrivatePage();
    });
})();
