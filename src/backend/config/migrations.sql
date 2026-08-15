-- ================================================
-- SIGMEI - Scripts SQL para Fases 2, 3, 4 y 5
-- Ejecutar en phpMyAdmin sobre la base de datos 'sigmei'
-- ================================================

-- ================================================
-- TABLA: incidencias
-- ================================================
CREATE TABLE IF NOT EXISTS incidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    estado ENUM('abierta', 'en_progreso', 'resuelta', 'cerrada') DEFAULT 'abierta',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ================================================
-- TABLA: mantenimientos
-- ================================================
CREATE TABLE IF NOT EXISTS mantenimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('preventivo', 'correctivo') NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_programada DATE NOT NULL,
    fecha_realizada DATE,
    estado ENUM('pendiente', 'en_progreso', 'completado', 'cancelado') DEFAULT 'pendiente',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ================================================
-- TABLA: metricas
-- ================================================
CREATE TABLE IF NOT EXISTS metricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    cpu_uso DECIMAL(5,2),
    ram_uso DECIMAL(5,2),
    disco_uso DECIMAL(5,2),
    temperatura_cpu DECIMAL(5,2),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
);

-- ================================================
-- TABLA: alertas
-- ================================================
CREATE TABLE IF NOT EXISTS alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    tipo ENUM('cpu_alta', 'ram_alta', 'disco_lleno', 'temperatura_critica', 'otro') NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    nivel ENUM('info', 'advertencia', 'critica') NOT NULL,
    estado ENUM('activa', 'reconocida', 'resuelta') DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id)
);
