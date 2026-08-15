const db = require('../config/database');

/**
 * Registra una acción en la tabla de auditoría.
 * @param {number|null} usuarioId - ID del usuario que realiza la acción (puede ser null para login)
 * @param {string} accion - Acción realizada (ej: 'Login exitoso', 'Creación', 'Eliminación')
 * @param {string} modulo - Módulo afectado (ej: 'auth', 'usuarios', 'equipos', 'incidencias')
 * @param {string} descripcion - Detalles descriptivos de la acción
 */
const registrarAccion = async (usuarioId, accion, modulo, descripcion) => {
    try {
        await db.query(
            `INSERT INTO auditoria (usuario_id, accion, modulo, descripcion)
             VALUES (?, ?, ?, ?)`,
            [usuarioId, accion, modulo, descripcion]
        );
        console.log(`📝 Auditoría registrada: [${modulo}] - ${accion} por Usuario ID ${usuarioId}`);
    } catch (error) {
        // En auditorías no bloqueamos la respuesta principal si falla la inserción de logs,
        // pero sí lo reportamos en la consola.
        console.error('❌ Falló el registro de auditoría:', error);
    }
};

module.exports = {
    registrarAccion
};
