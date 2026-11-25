
import { gameService } from '../services/gameService.js';
import { authService } from '../services/authService.js';
import { reviewService } from '../services/reviewService.js';
import { fileService } from '../services/fileService.js';
import { setupNavigation } from '../components/navigation.js';
import { refreshCommerce } from '../services/commerceState.js';
import { createPurchaseAction } from '../components/purchaseAction.js';
import {
    money,
    date,
    message,
    element,
    link,
    confirmAction
} from '../components/ui.js';

const status = document.getElementById('game-status');
const content = document.getElementById('game-content');
const gameCover = document.querySelector('.game-cover');
const retry = document.getElementById('retry-game');
const gameId = location.pathname.match(/^\/games\/([a-zA-Z0-9_-]+)\/?$/)?.[1];

document.getElementById('game-id').textContent = gameId || 'id inválido';

// Elementos de reseñas.
const reviewsStatus = document.getElementById('reviews-status');
const reviewsList = document.getElementById('reviews-list');
const reviewFormContainer = document.getElementById('review-form-container');
const reviewForm = document.getElementById('review-form');
const reviewFormTitle = document.getElementById('review-form-title');
const reviewRating = document.getElementById('review-rating');
const reviewComment = document.getElementById('review-comment');
const reviewImage = document.getElementById('review-image');
const reviewImageStatus = document.getElementById('review-image-status');
const cancelReview = document.getElementById('cancel-review');
const reviewMessage = document.getElementById('review-message');

let currentUser = null;
let editingReviewId = null;

function setText(selector, value, fallback = 'No disponible') {
    document.querySelector(selector).textContent = value ?? fallback;
}

// Validar la imagen seleccionada.
function validateReviewImage(file) {
    if (!file) return null;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
        return 'Selecciona una imagen PNG o JPG.';
    }

    if (file.size > 5 * 1024 * 1024) {
        return 'La imagen no puede superar los 5 MB.';
    }

    return null;
}

// Cargar las imágenes asociadas a una reseña.
async function loadReviewImages(reviewId, container) {
    try {
        const result = await fileService.getReviewImages(reviewId);
        const files = result.files || [];

        if (!files.length) return;

        const imagesContainer = element('div', 'review-images');

        files.forEach((file) => {
            if (!file.url) return;

            const image = element('img', 'review-image');
            image.src = file.url;
            image.alt = file.nombre_archivo || 'Imagen de la reseña';
            image.loading = 'lazy';

            imagesContainer.append(image);
        });

        if (imagesContainer.children.length > 0) {
            container.append(imagesContainer);
        }
    } catch (error) {
        console.error(
            `No se pudieron cargar las imágenes de la reseña ${reviewId}:`,
            error
        );
    }
}

async function loadGame() {
    status.hidden = false;
    status.classList.remove('is-error');
    status.textContent = 'Cargando detalles del juego...';
    content.hidden = true;
    retry.hidden = true;

    if (!gameId) {
        status.textContent =
            'La ruta del juego no contiene un identificador válido.';
        status.classList.add('is-error');
        return;
    }

    
    try {
        const game = await gameService.get(gameId);
        const title =
            game.titulo || game.title || game.nombre || `Juego ${gameId}`;

        document.title = `Gamix | ${title}`;
        setText('#page-title', title);
        setText('#game-title', title);

        // Cargar la portada del videojuego.
        const gameCover = document.querySelector('.game-cover');
        const gameTitle = document.getElementById('game-title');

        gameCover.querySelector('img')?.remove();

        gameTitle.textContent = title;

        try {
            const result = await fileService.getGameImages(gameId);
            const cover = result.files?.[0];

            if (cover?.url) {
                const image = document.createElement('img');

                image.src = cover.url;
                image.alt = `Portada de ${title}`;
                image.loading = 'eager';

                image.style.position = 'absolute';
                image.style.inset = '0';
                image.style.width = '100%';
                image.style.height = '100%';
                image.style.objectFit = 'cover';

                gameCover.style.position = 'relative';
                gameCover.style.overflow = 'hidden';

                gameTitle.style.position = 'relative';
                gameTitle.style.zIndex = '1';
                gameTitle.style.textShadow = '0 2px 5px #000';

                gameCover.prepend(image);
            }
        } catch (imageError) {
            console.error('No se pudo cargar la portada:', imageError);
        }

        setText(
            '#game-description',
            game.descripcion || game.description,
            'Este juego todavía no tiene descripción.'
        );

        setText('#game-genre', game.genero || game.genre || game.categoria);
        setText('#game-developer', game.desarrollador || game.developer);
        setText('#game-price', money(game.precio ?? game.price));
        setText('#game-release', date(game.fecha_lanzamiento, true));

        document
            .getElementById('purchase-actions')
            .replaceChildren(createPurchaseAction(game));

        content.hidden = false;
        status.hidden = true;
    } catch (error) {
        status.textContent =
            error.status === 404
                ? 'Este juego no existe o fue retirado de la tienda. Puedes explorar otros juegos en el catálogo.'
                : error.message || 'No se pudo cargar el videojuego.';

        status.classList.add('is-error');
        retry.hidden = false;
    }

}

// Mostrar las reseñas de un videojuego.
async function loadReviews() {
    if (!gameId) return;

    reviewsStatus.hidden = false;
    reviewsStatus.classList.remove('is-error');
    reviewsStatus.textContent = 'Cargando reseñas...';
    reviewsList.replaceChildren();

    try {
        const reviews = await reviewService.getByGame(gameId);

        reviewsStatus.hidden = true;

        if (!reviews.length) {
            reviewsList.append(
                element(
                    'p',
                    'reviews-empty',
                    'Todavía no hay reseñas para este videojuego.'
                )
            );
            return;
        }

        const reviewCards = reviews.map((review) => {
            const card = element('article', 'review-card');
            const header = element('div', 'review-header');
            const information = element('div', 'review-information');

            information.append(
                element(
                    'strong',
                    'review-author',
                    review.nombre || 'Usuario'
                ),
                element(
                    'span',
                    'review-date',
                    date(review.fecha_creacion)
                )
            );

            const rating = Number(review.calificacion) || 0;

            header.append(
                information,
                element(
                    'span',
                    'review-stars',
                    `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`
                )
            );

            card.append(
                header,
                element(
                    'p',
                    'review-comment',
                    review.comentario || 'Este usuario no dejó un comentario.'
                )
            );

            // Solo el autor puede editar o eliminar su reseña.
            if (
                currentUser?.id != null &&
                String(currentUser.id) === String(review.usuario_id)
            ) {
                const actions = element('div', 'review-actions');

                const editButton = element(
                    'button',
                    'terminal-button',
                    'Editar'
                );
                editButton.type = 'button';
                editButton.addEventListener('click', () => {
                    startEditingReview(review);
                });

                const deleteButton = element(
                    'button',
                    'terminal-button danger',
                    'Eliminar'
                );
                deleteButton.type = 'button';
                deleteButton.addEventListener('click', () => {
                    deleteReview(review.id);
                });

                actions.append(editButton, deleteButton);
                card.append(actions);
            }

            return { card, review };
        });

        reviewCards.forEach(({ card }) => {
            reviewsList.append(card);
        });

        // Cargar las imágenes de las reseñas.
        await Promise.all(
            reviewCards.map(({ card, review }) =>
                loadReviewImages(review.id, card)
            )
        );
    } catch (error) {
        reviewsStatus.textContent =
            error.message || 'No se pudieron cargar las reseñas.';
        reviewsStatus.classList.add('is-error');
    }
}

// Mostrar el formulario según el estado de la sesión.
function updateReviewAccess() {
    if (!currentUser) {
        reviewFormContainer.hidden = true;
        message(reviewMessage, 'Inicia sesión para publicar una reseña.');

        reviewMessage.append(
            link(
                'Iniciar sesión',
                `/login?next=${encodeURIComponent(location.pathname)}`
            )
        );
        return;
    }

    reviewFormContainer.hidden = false;
    reviewForm.hidden = false;
    message(reviewMessage, '');
}

// Preparar el formulario para editar una reseña.
function startEditingReview(review) {
    editingReviewId = review.id;
    reviewFormTitle.textContent = 'Editar mi reseña';
    reviewRating.value = String(review.calificacion);
    reviewComment.value = review.comentario || '';

    reviewForm.querySelector('button[type="submit"]').textContent =
        'Guardar cambios';

    cancelReview.hidden = false;
    reviewImage.value = '';
    message(reviewImageStatus, '');

    reviewMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Restaurar el formulario para publicar una nueva reseña.
function resetReviewForm() {
    editingReviewId = null;
    reviewForm.reset();
    reviewFormTitle.textContent = 'Escribe tu reseña';

    reviewForm.querySelector('button[type="submit"]').textContent =
        'Publicar reseña';

    cancelReview.hidden = true;
    message(reviewImageStatus, '');
}

// Publicar o actualizar una reseña.
reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const session = authService.getSession();

    if (!session) {
        message(reviewMessage, 'Inicia sesión para continuar.', true);
        return;
    }

    const data = {
        calificacion: Number(reviewRating.value),
        comentario: reviewComment.value.trim()
    };

    if (
        !Number.isInteger(data.calificacion) ||
        data.calificacion < 1 ||
        data.calificacion > 5
    ) {
        message(reviewMessage, 'Selecciona una calificación válida.', true);
        return;
    }

    const selectedImage = reviewImage.files[0];
    const imageError = validateReviewImage(selectedImage);

    if (imageError) {
        message(reviewImageStatus, imageError, true);
        return;
    }

    const submitButton = reviewForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        let reviewId;

        if (editingReviewId !== null) {
            reviewId = editingReviewId;

            await reviewService.update(reviewId, data, session.token);
        } else {
            const result = await reviewService.create(
                gameId,
                data,
                session.token
            );

            // El backend devuelve el ID directamente en result.id.
            reviewId = result.id;
        }

        // Subir la imagen si se seleccionó una.
        if (selectedImage) {
            try {
                await fileService.uploadReviewImage(
                    reviewId,
                    selectedImage,
                    session.token
                );

                message(
                    reviewMessage,
                    'Tu reseña y su imagen se guardaron correctamente.'
                );
            } catch (imageError) {
                console.error('Error al subir la imagen:', imageError);

                message(
                    reviewMessage,
                    'La reseña se guardó, pero no se pudo subir la imagen. Puedes intentarlo nuevamente al editarla.',
                    true
                );
            }
        } else {
            message(
                reviewMessage,
                editingReviewId !== null
                    ? 'Tu reseña se actualizó correctamente.'
                    : 'Tu reseña se publicó correctamente.'
            );
        }

        resetReviewForm();
        await loadReviews();
    } catch (error) {
        message(
            reviewMessage,
            error.message || 'No se pudo guardar la reseña.',
            true
        );
    } finally {
        submitButton.disabled = false;
    }
});

// Mostrar el nombre de la imagen seleccionada.
reviewImage.addEventListener('change', () => {
    const file = reviewImage.files[0];

    if (!file) {
        message(reviewImageStatus, '');
        return;
    }

    const error = validateReviewImage(file);

    if (error) {
        message(reviewImageStatus, error, true);
        reviewImage.value = '';
        return;
    }

    message(reviewImageStatus, `Imagen seleccionada: ${file.name}`);
});

// Cancelar una edición.
cancelReview.addEventListener('click', () => {
    resetReviewForm();
    message(reviewMessage, '');
});

// Eliminar una reseña propia.
async function deleteReview(reviewId) {
    const accepted = await confirmAction({
        title: 'Eliminar reseña',
        description: '¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.',
        confirm: 'Eliminar',
        danger: true
    });

    if (!accepted) return;

    const session = authService.getSession();

    if (!session) {
        message(
            reviewMessage,
            'Tu sesión ha expirado. Inicia sesión nuevamente.',
            true
        );
        return;
    }

    try {
        await reviewService.remove(reviewId, session.token);
        message(reviewMessage, 'La reseña se eliminó correctamente.');
        await loadReviews();
    } catch (error) {
        message(
            reviewMessage,
            error.message || 'No se pudo eliminar la reseña.',
            true
        );
    }
}

setupNavigation(authService.getSession()?.user || null);

async function loadAccount() {
    if (!authService.getSession()) {
        updateReviewAccess();
        return;
    }

    try {
        const user = await authService.validateSession();

        currentUser = user;
        setupNavigation(user);
        updateReviewAccess();

        await refreshCommerce();
        await loadReviews();
    } catch (error) {
        if (error.status === 401) {
            authService.clearSession();
            currentUser = null;
            setupNavigation(null);
            updateReviewAccess();
            await loadReviews();
        } else {
            message(
                document.getElementById('account-status'),
                'No pudimos actualizar tu cuenta. Se comprobará de nuevo al añadir el juego.',
                true
            );
        }
    }
}

retry.addEventListener('click', loadGame);

loadGame();
loadReviews();
loadAccount();

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        loadGame();
        loadAccount();
        loadReviews();
    }
});
