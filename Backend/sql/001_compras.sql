-- Aplicar en la base de Gamix. Los juegos existentes siguen publicados.
ALTER TABLE juegos ADD COLUMN IF NOT EXISTS publicado BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS carrito_items (
    usuario_id INT NOT NULL,
    juego_id INT NOT NULL,
    PRIMARY KEY (usuario_id, juego_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (juego_id) REFERENCES juegos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
