-- ============================================================
-- SCRIPTS SQL - Backend Tienda de Videojuegos GAMIX
-- ============================================================
-- Instrucciones:
--   Ejecuta cada bloque en orden desde la consola SQL de XAMPP
--   (phpMyAdmin > pestaña SQL, o desde la terminal de XAMPP Shell).
--   NO uses la opción "Importar" de phpMyAdmin.
--   Ejecuta los bloques paso a paso en el orden indicado.
-- ============================================================



-- 1. Crear base de datos de steamstore_db
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS steamstore_db;

USE steamstore_db;

-- =========================================
-- TABLA: usuarios
-- =========================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLA: categorias
-- =========================================

CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- =========================================
-- TABLA: juegos
-- =========================================

CREATE TABLE juegos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    desarrollador VARCHAR(150),
    fecha_lanzamiento DATE,
    stock INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLA: juego_categoria
-- =========================================

CREATE TABLE juego_categoria (
    juego_id INT NOT NULL,
    categoria_id INT NOT NULL,

    PRIMARY KEY (juego_id, categoria_id),

    FOREIGN KEY (juego_id)
        REFERENCES juegos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (categoria_id)
        REFERENCES categorias(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLA: carritos
-- =========================================

CREATE TABLE carritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLA: carrito_detalle
-- =========================================

CREATE TABLE carrito_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carrito_id INT NOT NULL,
    juego_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,

    FOREIGN KEY (carrito_id)
        REFERENCES carritos(id)
        ON DELETE CASCADE,

    FOREIGN KEY (juego_id)
        REFERENCES juegos(id)
        ON DELETE CASCADE,

    UNIQUE (carrito_id, juego_id)
);

-- =========================================
-- TABLA: compras
-- =========================================

CREATE TABLE compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLA: compra_detalle
-- =========================================

CREATE TABLE compra_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    juego_id INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,

    FOREIGN KEY (compra_id)
        REFERENCES compras(id)
        ON DELETE CASCADE,

    FOREIGN KEY (juego_id)
        REFERENCES juegos(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLA: biblioteca
-- =========================================

CREATE TABLE biblioteca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    juego_id INT NOT NULL,
    fecha_adquisicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    FOREIGN KEY (juego_id)
        REFERENCES juegos(id)
        ON DELETE CASCADE,

    UNIQUE (usuario_id, juego_id)
);

-- ============================================================
-- FIN DE LOS SCRIPTS
-- ============================================================

--2.0 ACORDE A LA ARQUITECTURA DE LOS MODELOS DEL COMPAÑERO SEBASTIAN. EJECUTAR EL PRIMER BLOQUE DE DE LA SECCION SCRIPTS PARA CREAR LAS TABLAS y la basedb.
--Esta segunda sección pertenece a la modificacion de las tablas y variables que se definen y que se
--alinean con el diagrama de la web desarrollado por el compañero Sebastian.
USE steamstore_db;

-- 1. Eliminar tablas que el diseño nuevo no usa
DROP TABLE IF EXISTS carrito_detalle;
DROP TABLE IF EXISTS carritos;
DROP TABLE IF EXISTS biblioteca;
DROP TABLE IF EXISTS juego_categoria;
DROP TABLE IF EXISTS categorias;

-- 2. Ajustar juegos al VIDEOJUEGO del diagrama
ALTER TABLE juegos
    DROP COLUMN stock,
    DROP COLUMN imagen,
    ADD COLUMN genero VARCHAR(50) NOT NULL AFTER descripcion;

-- 3. DETALLE_COMPRA no tiene cantidad (juegos digitales)
ALTER TABLE compra_detalle DROP COLUMN cantidad;

-- 4. RESEÑA
CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    juego_id INT NOT NULL,
    calificacion INT NOT NULL,
    comentario TEXT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP);


-- 5. ARCHIVO (foto de perfil O imagen de juego)
CREATE TABLE archivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    juego_id INT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tamano INT NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP);