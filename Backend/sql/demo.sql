-- Datos opcionales para una instalación de demostración.
INSERT INTO juegos (titulo, genero, descripcion, precio, desarrollador)
SELECT 'Órbita de papel', 'Aventura', 'Explora un sistema solar dibujado a mano.', 12.50, 'Gamix Demo'
WHERE NOT EXISTS (SELECT 1 FROM juegos WHERE titulo = 'Órbita de papel' AND desarrollador = 'Gamix Demo');
INSERT INTO juegos (titulo, genero, descripcion, precio, desarrollador)
SELECT 'Circuito lunar', 'Carreras', 'Compite en pistas de baja gravedad.', 7.25, 'Gamix Demo'
WHERE NOT EXISTS (SELECT 1 FROM juegos WHERE titulo = 'Circuito lunar' AND desarrollador = 'Gamix Demo');
