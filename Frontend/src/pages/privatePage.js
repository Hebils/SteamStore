import { authService } from '../services/authService.js';
import { setupNavigation } from '../components/navigation.js';
import { refreshCommerce } from '../services/commerceState.js';
import { fileService } from '../services/fileService.js';

const status = document.getElementById('route-status');
const content = document.getElementById('protected-content');
const retry = document.getElementById('retry-session');

function initials(name = '') {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0] || '')
            .join('')
            .toUpperCase() || 'G'
    );
}

function showProfile(user) {
    const values = {
        '[data-profile-name]': user.nombre || 'No disponible',
        '[data-profile-email]': user.email || 'No disponible',
        '[data-profile-role]': user.rol || 'usuario',
        '[data-profile-id]': user.id ?? 'No disponible'
    };

    Object.entries(values).forEach(([selector, value]) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    });

    const avatar = document.getElementById('profile-avatar');

    if (avatar) {
        avatar.textContent = initials(user.nombre || user.email);
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');

    if (nameInput) nameInput.value = user.nombre || '';
    if (emailInput) emailInput.value = user.email || '';
}

async function loadProfileImage(token, fallback) {
    const avatar = document.getElementById('profile-avatar');

    if (!avatar) return;

    try {
        const result = await fileService.getProfileImages(token);
        const files = result.files || [];

        avatar.replaceChildren();

        if (files.length > 0 && files[0].url) {
            const img = document.createElement('img');
            img.src = files[0].url;
            img.alt = 'Foto de perfil';
            avatar.appendChild(img);
        } else {
            avatar.textContent = fallback;
        }
    } catch (error) {
        console.error('Error al cargar la foto de perfil:', error);
        avatar.textContent = fallback;
    }
}

async function loadMyFiles(token) {
    const filesList = document.getElementById('profile-files-list');
    const filesStatus = document.getElementById('profile-files-status');

    if (!filesList || !filesStatus) return;

    filesStatus.textContent = 'Cargando archivos...';
    filesList.replaceChildren();

    try {
        const result = await fileService.getMyFiles(token);
        const files = result.files || [];

        if (files.length === 0) {
            filesStatus.textContent = 'Todavía no has subido archivos.';
            return;
        }

        filesStatus.textContent = `Has subido ${files.length} archivo(s).`;

        files.forEach((file) => {
            const card = document.createElement('article');
            card.className = 'profile-file-card';

            if (file.url) {
                const image = document.createElement('img');
                image.src = file.url;
                image.alt = file.nombre_archivo || 'Imagen subida';
                image.loading = 'lazy';
                card.appendChild(image);
            }

            const name = document.createElement('p');
            name.textContent = file.nombre_archivo || 'Archivo sin nombre';

            const type = document.createElement('p');

            const types = {
                perfil: 'Foto de perfil',
                portada: 'Portada de videojuego',
                resena: 'Imagen de reseña',
                captura: 'Captura'
            };

            type.textContent = `Tipo: ${
                types[file.tipo_archivo] || file.tipo_archivo
            }`;

            const date = document.createElement('p');
            const uploadDate = file.fecha_creacion
                ? new Date(file.fecha_creacion)
                : null;

            date.textContent =
                uploadDate && !Number.isNaN(uploadDate.getTime())
                    ? `Fecha: ${uploadDate.toLocaleDateString('es-CO')}`
                    : 'Fecha no disponible';

            card.append(name, type, date);
            filesList.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar los archivos propios:', error);

        filesStatus.textContent =
            error.message || 'No se pudieron cargar tus archivos.';
    }
}

async function loadPrivatePage() {
    status.hidden = false;
    status.classList.remove('is-error');
    status.textContent = 'Cargando tu cuenta...';
    retry.hidden = true;
    content.hidden = true;

    const session = authService.getSession();

    if (!session) {
        const next = encodeURIComponent(
            `${location.pathname}${location.search}`
        );

        location.replace(`/login?next=${next}`);
        return;
    }

    try {
        const user = await authService.validateSession();

        setupNavigation(user);

        if (document.body.dataset.page === 'profile') {
            showProfile(user);

            const currentSession = authService.getSession();

            loadProfileImage(
                currentSession.token,
                initials(user.nombre || user.email)
            );

            loadMyFiles(currentSession.token);
        }

        status.hidden = true;
        content.hidden = false;

        refreshCommerce().catch(() => {});
    } catch (error) {
        if (error.status === 401) {
            authService.clearSession();

            const next = encodeURIComponent(
                `${location.pathname}${location.search}`
            );

            location.replace(`/login?next=${next}`);
            return;
        }

        status.textContent =
            error.message ||
            'No se pudo verificar la sesión. Intenta de nuevo.';

        status.classList.add('is-error');
        retry.hidden = false;
    }
}

// EDITAR DATOS DEL PERFIL

const profileEditForm = document.getElementById('profile-edit-form');
const profileEditStatus = document.getElementById('profile-edit-status');
const profileSaveButton = document.getElementById('profile-save-button');

if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document
            .getElementById('profile-name')
            .value.trim();

        const email = document
            .getElementById('profile-email')
            .value.trim()
            .toLowerCase();

        if (!nombre || nombre.length > 100) {
            profileEditStatus.textContent =
                'El nombre es obligatorio y no puede superar los 100 caracteres.';
            return;
        }

        if (!email || email.length > 150) {
            profileEditStatus.textContent =
                'Ingresa un correo válido de máximo 150 caracteres.';
            return;
        }

        profileEditStatus.textContent = 'Guardando cambios...';
        profileSaveButton.disabled = true;

        try {
            const result = await authService.updateProfile({
                nombre,
                email
            });

            showProfile(result.usuario);

            setupNavigation(result.usuario);

            // Volver a cargar la foto de perfil.
            const currentSession = authService.getSession();

            if (currentSession) {
                await loadProfileImage(currentSession.token, result.usuario);
            }

            profileEditStatus.textContent =
                result.message || 'Perfil actualizado correctamente.';
        } catch (error) {
            profileEditStatus.textContent =
                error.message || 'No se pudieron guardar los cambios.';
        } finally {
            profileSaveButton.disabled = false;
        }
    });
}

// CAMBIAR FOTO DE PERFIL

const profileImageInput = document.getElementById('profile-image');

const profileImageStatus = document.getElementById(
    'profile-image-status'
);

if (profileImageInput) {
    profileImageInput.addEventListener('change', async () => {
        const file = profileImageInput.files[0];

        if (!file) return;

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            profileImageStatus.textContent =
                'Selecciona una imagen PNG o JPG.';

            profileImageInput.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            profileImageStatus.textContent =
                'La imagen no puede superar los 5 MB.';

            profileImageInput.value = '';
            return;
        }

        const session = authService.getSession();

        if (!session) return;

        profileImageStatus.textContent = 'Subiendo imagen...';
        profileImageInput.disabled = true;

        try {
            const result = await fileService.uploadProfileImage(
                file,
                session.token
            );

            if (result.file?.url) {
                const avatar = document.getElementById('profile-avatar');

                avatar.replaceChildren();

                const img = document.createElement('img');
                img.src = result.file.url;
                img.alt = 'Foto de perfil';

                avatar.appendChild(img);

                profileImageStatus.textContent =
                    'Foto de perfil actualizada correctamente.';

                loadMyFiles(session.token);
            }
        } catch (error) {
            profileImageStatus.textContent =
                error.message || 'No se pudo subir la imagen.';
        } finally {
            profileImageInput.disabled = false;
            profileImageInput.value = '';
        }
    });
}

setupNavigation();

retry.addEventListener('click', loadPrivatePage);

loadPrivatePage();

window.addEventListener('pageshow', (event) => {
    if (event.persisted) loadPrivatePage();
});
