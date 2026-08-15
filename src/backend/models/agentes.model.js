const db = require('../config/database');

const findByEquipoId = async (equipoId) => {
    const [rows] = await db.query('SELECT * FROM agentes WHERE equipo_id = ?', [equipoId]);
    return rows[0] || null;
};

const updateHeartbeat = async (equipoId, versionAgente) => {
    await db.query(
        `UPDATE agentes 
         SET estado = 'online', ultima_conexion = CURRENT_TIMESTAMP, version_agente = ? 
         WHERE equipo_id = ?`,
        [versionAgente, equipoId]
    );
};

const setOffline = async (equipoId) => {
    await db.query(
        `UPDATE agentes SET estado = 'offline' WHERE equipo_id = ?`,
        [equipoId]
    );
};

const findAll = async () => {
    const [rows] = await db.query(`
        SELECT a.id, a.equipo_id, a.version_agente, a.estado, a.ultima_conexion, e.nombre as equipo_nombre
        FROM agentes a
        JOIN equipos e ON a.equipo_id = e.id
    `);
    return rows;
};

module.exports = {
    findByEquipoId,
    updateHeartbeat,
    setOffline,
    findAll
};
