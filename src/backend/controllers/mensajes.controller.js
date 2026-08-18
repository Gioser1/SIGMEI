const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

// Obtener historial de mensajes de una incidencia
const getMensajesByIncidencia = catchAsync(async (req, res) => {
    const { incidencia_id } = req.params;

    const [mensajes] = await db.query(
        `SELECT
            m.id,
            m.incidencia_id,
            m.remitente_id,
            u.nombre AS remitente_nombre,
            u.rol_id AS remitente_rol,
            m.mensaje,
            m.fecha_envio
        FROM mensajes_incidencias m
        INNER JOIN usuarios u ON m.remitente_id = u.id
        WHERE m.incidencia_id = ?
        ORDER BY m.fecha_envio ASC`,
        [incidencia_id]
    );

    res.json(mensajes);
});

// Guardar mensaje nuevo en la base de datos
const crearMensaje = catchAsync(async (req, res) => {
    const { incidencia_id } = req.params;
    const { mensaje } = req.body;
    const remitente_id = req.usuario.id;

    if (!mensaje || !mensaje.trim()) {
        const error = new Error('El mensaje no puede estar vacío');
        error.statusCode = 400;
        throw error;
    }

    const [resultado] = await db.query(
        `INSERT INTO mensajes_incidencias (incidencia_id, remitente_id, mensaje)
         VALUES (?, ?, ?)`,
        [incidencia_id, remitente_id, mensaje.trim()]
    );

    // Obtener el mensaje guardado con datos del usuario
    const [nuevo] = await db.query(
        `SELECT
            m.id,
            m.incidencia_id,
            m.remitente_id,
            u.nombre AS remitente_nombre,
            u.rol_id AS remitente_rol,
            m.mensaje,
            m.fecha_envio
        FROM mensajes_incidencias m
        INNER JOIN usuarios u ON m.remitente_id = u.id
        WHERE m.id = ?`,
        [resultado.insertId]
    );

    // Emitir mensaje por WebSocket a la sala del chat
    const io = req.app.get('io');
    if (io && nuevo.length > 0) {
        io.to(`chat_${incidencia_id}`).emit('nuevo_mensaje', nuevo[0]);
    }

    res.status(201).json(nuevo[0]);
});

module.exports = {
    getMensajesByIncidencia,
    crearMensaje
};
