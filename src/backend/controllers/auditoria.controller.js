const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

// Obtener todas las auditorías (con datos de usuario)
const getAuditorias = catchAsync(async (req, res) => {
    const [rows] = await db.query(
        `SELECT a.*, u.nombre as usuario_nombre, u.correo as usuario_correo
         FROM auditoria a
         LEFT JOIN usuarios u ON a.usuario_id = u.id
         ORDER BY a.fecha DESC`
    );

    res.json(rows);
});

// Obtener una auditoría por ID
const getAuditoriaById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const [rows] = await db.query(
        `SELECT a.*, u.nombre as usuario_nombre, u.correo as usuario_correo
         FROM auditoria a
         LEFT JOIN usuarios u ON a.usuario_id = u.id
         WHERE a.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        const error = new Error('Log de auditoría no encontrado');
        error.statusCode = 404;
        throw error;
    }

    res.json(rows[0]);
});

module.exports = {
    getAuditorias,
    getAuditoriaById
};
