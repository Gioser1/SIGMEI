const db = require('../config/database');

const getHardwareGeneralByEquipo = async (equipoId) => {
    const [cpu] = await db.query('SELECT * FROM hardware_cpu WHERE equipo_id = ?', [equipoId]);
    const [ram] = await db.query('SELECT * FROM hardware_ram WHERE equipo_id = ?', [equipoId]);
    const [gpu] = await db.query('SELECT * FROM hardware_gpu WHERE equipo_id = ?', [equipoId]);
    const [discos] = await db.query('SELECT * FROM hardware_discos WHERE equipo_id = ?', [equipoId]);
    const [motherboard] = await db.query('SELECT * FROM hardware_motherboard WHERE equipo_id = ?', [equipoId]);

    return {
        cpu: cpu[0] || null,
        ram: ram || [],
        gpu: gpu || [],
        discos: discos || [],
        motherboard: motherboard[0] || null
    };
};

const getSoftwareByEquipo = async (equipoId) => {
    const [software] = await db.query('SELECT * FROM software_instalado WHERE equipo_id = ?', [equipoId]);
    return software || [];
};

const logHardwareChange = async (equipoId, componente, accion, anterior, nuevo) => {
    await db.query(
        `INSERT INTO hardware_historial (equipo_id, componente, accion, detalle_anterior, detalle_nuevo)
         VALUES (?, ?, ?, ?, ?)`,
        [equipoId, componente, accion, anterior ? JSON.stringify(anterior) : null, nuevo ? JSON.stringify(nuevo) : null]
    );
};

// --- CPU ---
const insertCpu = async (cpuData) => {
    const { equipo_id, modelo, fabricante, nucleos, hilos, frecuencia_base, socket, tdp, cache } = cpuData;
    await db.query(
        `INSERT INTO hardware_cpu (equipo_id, modelo, fabricante, nucleos, hilos, frecuencia_base, socket, tdp, cache)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [equipo_id, modelo, fabricante, nucleos, hilos, frecuencia_base, socket, tdp, cache]
    );
};
const deleteCpu = async (equipoId) => {
    await db.query('DELETE FROM hardware_cpu WHERE equipo_id = ?', [equipoId]);
};

// --- RAM ---
const insertRamBulk = async (equipoId, ramArray) => {
    if (!ramArray || ramArray.length === 0) return;
    const values = ramArray.map(r => [
        equipoId, r.banco_slot, r.capacidad_gb, r.velocidad_mhz, r.tipo, r.fabricante, r.numero_serie
    ]);
    await db.query(
        `INSERT INTO hardware_ram (equipo_id, banco_slot, capacidad_gb, velocidad_mhz, tipo, fabricante, numero_serie)
         VALUES ?`,
        [values]
    );
};
const deleteRam = async (equipoId) => {
    await db.query('DELETE FROM hardware_ram WHERE equipo_id = ?', [equipoId]);
};

// --- GPU ---
const insertGpuBulk = async (equipoId, gpuArray) => {
    if (!gpuArray || gpuArray.length === 0) return;
    const values = gpuArray.map(g => [
        equipoId, g.modelo, g.fabricante, g.vram_gb, g.pcie_version
    ]);
    await db.query(
        `INSERT INTO hardware_gpu (equipo_id, modelo, fabricante, vram_gb, pcie_version)
         VALUES ?`,
        [values]
    );
};
const deleteGpu = async (equipoId) => {
    await db.query('DELETE FROM hardware_gpu WHERE equipo_id = ?', [equipoId]);
};

// --- Discos ---
const insertDiscosBulk = async (equipoId, discosArray) => {
    if (!discosArray || discosArray.length === 0) return;
    const values = discosArray.map(d => [
        equipoId, d.modelo, d.fabricante, d.capacidad_gb, d.tipo, d.interfaz, d.numero_serie
    ]);
    await db.query(
        `INSERT INTO hardware_discos (equipo_id, modelo, fabricante, capacidad_gb, tipo, interfaz, numero_serie)
         VALUES ?`,
        [values]
    );
};
const deleteDiscos = async (equipoId) => {
    await db.query('DELETE FROM hardware_discos WHERE equipo_id = ?', [equipoId]);
};

// --- Motherboard ---
const insertMotherboard = async (mbData) => {
    const { equipo_id, fabricante, modelo, chipset, socket, bios_version } = mbData;
    await db.query(
        `INSERT INTO hardware_motherboard (equipo_id, fabricante, modelo, chipset, socket, bios_version)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         fabricante=VALUES(fabricante), modelo=VALUES(modelo), chipset=VALUES(chipset), 
         socket=VALUES(socket), bios_version=VALUES(bios_version)`,
        [equipo_id, fabricante, modelo, chipset, socket, bios_version]
    );
};
const deleteMotherboard = async (equipoId) => {
    await db.query('DELETE FROM hardware_motherboard WHERE equipo_id = ?', [equipoId]);
};

// --- Software ---
const insertSoftwareBulk = async (equipoId, softwareArray) => {
    if (!softwareArray || softwareArray.length === 0) return;
    const values = softwareArray.map(s => [
        equipoId, s.nombre, s.version, s.editor, s.fecha_instalacion || null
    ]);
    await db.query(
        `INSERT INTO software_instalado (equipo_id, nombre, version, editor, fecha_instalacion)
         VALUES ?`,
        [values]
    );
};
const deleteSoftware = async (equipoId) => {
    await db.query('DELETE FROM software_instalado WHERE equipo_id = ?', [equipoId]);
};

module.exports = {
    getHardwareGeneralByEquipo,
    getSoftwareByEquipo,
    logHardwareChange,
    insertCpu, deleteCpu,
    insertRamBulk, deleteRam,
    insertGpuBulk, deleteGpu,
    insertDiscosBulk, deleteDiscos,
    insertMotherboard, deleteMotherboard,
    insertSoftwareBulk, deleteSoftware
};
