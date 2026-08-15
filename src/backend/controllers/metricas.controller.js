const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

// Obtener todas las métricas (con datos del equipo)
const getMetricas = catchAsync(async (req, res) => {
    const [rows] = await db.query(
        `SELECT
            m.id,
            m.equipo_id,
            e.nombre AS equipo_nombre,
            m.cpu_uso,
            m.ram_uso,
            m.disco_uso,
            m.temperatura_cpu,
            m.fecha_registro
        FROM metricas m
        INNER JOIN equipos e ON m.equipo_id = e.id
        ORDER BY m.fecha_registro DESC`
    );

    res.json(rows);
});

// Obtener métrica por ID
const getMetricaById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const [rows] = await db.query(
        `SELECT
            m.id,
            m.equipo_id,
            e.nombre AS equipo_nombre,
            m.cpu_uso,
            m.ram_uso,
            m.disco_uso,
            m.temperatura_cpu,
            m.fecha_registro
        FROM metricas m
        INNER JOIN equipos e ON m.equipo_id = e.id
        WHERE m.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        const error = new Error('Métrica no encontrada');
        error.statusCode = 404;
        throw error;
    }

    res.json(rows[0]);
});

// Crear métrica
const crearMetrica = catchAsync(async (req, res) => {
    const {
        equipo_id,
        cpu_uso,
        ram_uso,
        disco_uso,
        temperatura_cpu
    } = req.body;

    // Verificar que el equipo existe
    const [equipo] = await db.query(
        'SELECT id FROM equipos WHERE id = ?',
        [equipo_id]
    );

    if (equipo.length === 0) {
        const error = new Error('El equipo especificado no existe');
        error.statusCode = 404;
        throw error;
    }

    const [resultado] = await db.query(
        `INSERT INTO metricas
        (equipo_id, cpu_uso, ram_uso, disco_uso, temperatura_cpu)
        VALUES (?, ?, ?, ?, ?)`,
        [
            equipo_id,
            cpu_uso !== undefined ? cpu_uso : null,
            ram_uso !== undefined ? ram_uso : null,
            disco_uso !== undefined ? disco_uso : null,
            temperatura_cpu !== undefined ? temperatura_cpu : null
        ]
    );

    res.status(201).json({
        mensaje: 'Métrica registrada correctamente',
        id: resultado.insertId
    });
});

// Actualizar métrica
const actualizarMetrica = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la métrica existe
    const [existente] = await db.query(
        'SELECT id FROM metricas WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Métrica no encontrada');
        error.statusCode = 404;
        throw error;
    }

    const {
        equipo_id,
        cpu_uso,
        ram_uso,
        disco_uso,
        temperatura_cpu
    } = req.body;

    if (equipo_id) {
        const [eq] = await db.query('SELECT id FROM equipos WHERE id = ?', [equipo_id]);
        if (eq.length === 0) {
            const error = new Error('El equipo especificado no existe');
            error.statusCode = 404;
            throw error;
        }
    }

    await db.query(
        `UPDATE metricas
        SET equipo_id = COALESCE(?, equipo_id),
            cpu_uso = COALESCE(?, cpu_uso),
            ram_uso = COALESCE(?, ram_uso),
            disco_uso = COALESCE(?, disco_uso),
            temperatura_cpu = COALESCE(?, temperatura_cpu)
        WHERE id = ?`,
        [
            equipo_id || null,
            cpu_uso !== undefined ? cpu_uso : null,
            ram_uso !== undefined ? ram_uso : null,
            disco_uso !== undefined ? disco_uso : null,
            temperatura_cpu !== undefined ? temperatura_cpu : null,
            id
        ]
    );

    res.json({
        mensaje: 'Métrica actualizada correctamente'
    });
});

// Eliminar métrica
const eliminarMetrica = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la métrica existe
    const [existente] = await db.query(
        'SELECT id FROM metricas WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Métrica no encontrada');
        error.statusCode = 404;
        throw error;
    }

    await db.query(
        'DELETE FROM metricas WHERE id = ?',
        [id]
    );

    res.json({
        mensaje: 'Métrica eliminada correctamente'
    });
});

module.exports = {
    getMetricas,
    getMetricaById,
    crearMetrica,
    actualizarMetrica,
    eliminarMetrica
};
