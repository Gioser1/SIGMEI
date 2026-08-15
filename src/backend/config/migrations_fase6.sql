-- ================================================
-- SIGMEI - Scripts SQL para Fase 6 (Agente y Diagnóstico Empresarial)
-- Ejecutar en la base de datos 'sigmei'
-- ================================================

-- 1. GESTIÓN DE AGENTES
CREATE TABLE IF NOT EXISTS agentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    version_agente VARCHAR(50) DEFAULT '1.0.0',
    estado ENUM('online', 'offline') DEFAULT 'offline',
    ultima_conexion DATETIME,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

-- 2. CATÁLOGOS DE HARDWARE (Preparados para IA y Cuellos de Botella)
CREATE TABLE IF NOT EXISTS catalogo_cpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(200) NOT NULL UNIQUE,
    fabricante VARCHAR(100),
    socket VARCHAR(100),
    tdp INT, -- en Watts
    benchmark_score INT, -- PassMark u otro
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogo_gpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(200) NOT NULL UNIQUE,
    fabricante VARCHAR(100),
    pcie_req VARCHAR(50),
    psu_req_watts INT,
    benchmark_score INT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogo_motherboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(200) NOT NULL UNIQUE,
    fabricante VARCHAR(100),
    chipset VARCHAR(100),
    sockets_soportados VARCHAR(255),
    max_ram_gb INT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. INVENTARIO FÍSICO DETALLADO (Relación 1:N)
CREATE TABLE IF NOT EXISTS hardware_cpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    modelo VARCHAR(200) NOT NULL,
    fabricante VARCHAR(100),
    nucleos INT,
    hilos INT,
    frecuencia_base DECIMAL(8,2),
    socket VARCHAR(100),
    tdp INT,
    cache VARCHAR(100),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hardware_ram (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    banco_slot VARCHAR(50),
    capacidad_gb DECIMAL(6,2) NOT NULL,
    velocidad_mhz INT,
    tipo VARCHAR(50), -- DDR4, DDR5
    fabricante VARCHAR(100),
    numero_serie VARCHAR(150),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hardware_gpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    modelo VARCHAR(200) NOT NULL,
    fabricante VARCHAR(100),
    vram_gb DECIMAL(6,2),
    pcie_version VARCHAR(50),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hardware_discos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    modelo VARCHAR(200) NOT NULL,
    fabricante VARCHAR(100),
    capacidad_gb DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(50), -- NVMe, SSD, HDD
    interfaz VARCHAR(50),
    numero_serie VARCHAR(150),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hardware_motherboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL UNIQUE,
    fabricante VARCHAR(100),
    modelo VARCHAR(200) NOT NULL,
    chipset VARCHAR(100),
    socket VARCHAR(100),
    bios_version VARCHAR(100),
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS software_instalado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    version VARCHAR(100),
    editor VARCHAR(200),
    fecha_instalacion DATE,
    fecha_reporte DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

-- 4. HISTORIAL DE CAMBIOS FÍSICOS (Auditoría)
CREATE TABLE IF NOT EXISTS hardware_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    componente VARCHAR(50) NOT NULL, -- CPU, RAM, GPU, DISCO
    accion ENUM('AGREGADO', 'REMOVIDO', 'MODIFICADO') NOT NULL,
    detalle_anterior TEXT,
    detalle_nuevo TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

-- 5. MÁTRICAS AVANZADAS Y DIAGNÓSTICO
CREATE TABLE IF NOT EXISTS metricas_avanzadas_raw (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    payload JSON NOT NULL, -- Datos de sensores puros
    health_score INT DEFAULT 100, -- Calculado (0-100)
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Índices para optimizar las consultas de Time-Series
CREATE INDEX idx_metricas_equipo_fecha ON metricas_avanzadas_raw(equipo_id, fecha_registro);
CREATE INDEX idx_metricas_fecha ON metricas_avanzadas_raw(fecha_registro);

-- 6. ALERTAS PREDICTIVAS Y RECOMENDACIONES (Preparadas para IA)
CREATE TABLE IF NOT EXISTS alertas_predictivas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    tipo VARCHAR(100) NOT NULL, -- degradacion_smart, temp_incremental
    mensaje TEXT NOT NULL,
    tendencia VARCHAR(100),
    severidad ENUM('info', 'advertencia', 'critica') NOT NULL,
    estado ENUM('activa', 'reconocida', 'resuelta') DEFAULT 'activa',
    ai_analysis JSON, -- Espacio para diagnósticos asistidos por IA futuros
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recomendaciones_inteligentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    tipo_recomendacion VARCHAR(100) NOT NULL, -- upgrade_ram, bottleneck_cpu_gpu
    detalle TEXT NOT NULL,
    justificacion TEXT NOT NULL,
    estado ENUM('activa', 'aplicada', 'ignorada') DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
);

-- 7. SISTEMA UNIFICADO DE NOTIFICACIONES (Dashboard, Email, Webhooks)
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT, -- Opcional, puede ser una notificación general de sistema
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'alerta', 'hardware', 'sistema') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    canales JSON, -- ['dashboard', 'email']
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL
);

-- ================================================
-- SEEDERS INICIALES (Catálogo de Hardware Común)
-- ================================================
INSERT IGNORE INTO catalogo_cpu (modelo, fabricante, socket, tdp, benchmark_score) VALUES
('AMD Ryzen 5 5600X', 'AMD', 'AM4', 65, 22152),
('AMD Ryzen 7 5800X3D', 'AMD', 'AM4', 105, 28000),
('Intel Core i5-12400F', 'Intel', 'LGA1700', 65, 19500),
('Intel Core i7-13700K', 'Intel', 'LGA1700', 125, 46000),
('AMD Ryzen 9 7950X', 'AMD', 'AM5', 170, 63000);

INSERT IGNORE INTO catalogo_gpu (modelo, fabricante, pcie_req, psu_req_watts, benchmark_score) VALUES
('NVIDIA GeForce RTX 3060', 'NVIDIA', 'PCIe 4.0 x16', 550, 17000),
('NVIDIA GeForce RTX 4070', 'NVIDIA', 'PCIe 4.0 x16', 650, 27000),
('AMD Radeon RX 6700 XT', 'AMD', 'PCIe 4.0 x16', 650, 20000),
('NVIDIA GeForce GTX 1650', 'NVIDIA', 'PCIe 3.0 x16', 300, 7800),
('Intel Arc A770', 'Intel', 'PCIe 4.0 x16', 600, 15000);
