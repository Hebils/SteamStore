-- La instalación de XAMPP del equipo también admite archivos anteriores sin tipo/MIME.
ALTER TABLE archivos
    ADD COLUMN IF NOT EXISTS tipo_archivo ENUM('portada','captura','perfil','resena') NULL,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS autor_id INT NULL REFERENCES usuarios(id),
    ADD COLUMN IF NOT EXISTS resena_id INT NULL REFERENCES resenas(id) ON DELETE SET NULL;
ALTER TABLE archivos MODIFY COLUMN tipo_archivo ENUM('portada','captura','perfil','resena') NULL;
CREATE INDEX IF NOT EXISTS idx_archivos_perfil ON archivos (usuario_id, tipo_archivo, id);
CREATE INDEX IF NOT EXISTS idx_archivos_juego ON archivos (juego_id, tipo_archivo, id);
