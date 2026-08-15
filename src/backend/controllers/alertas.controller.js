const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

// Obtener todas las alertas (soporta paginación, filtros, ordenamiento y búsqueda)
const getAlertas = catchAsync(async (req, res) => {
    const { page, limit, nivel, estado, tipo, equipo_id, q, search, sortBy, sortOrder } = req.query;

    let queryStr = `
        SELECT
            a.id,
            a.equipo_id,
            e.nombre AS equipo_nombre,
            a.tipo,
            a.mensaje,
            a.nivel,
            a.estado,
            a.fecha_creacion
        FROM alertas a
        INNER JOIN equipos e ON a.equipo_id = e.id
    `;
    
    let countQueryStr = `
        SELECT COUNT(*) as total
        FROM alertas a
        INNER JOIN equipos e ON a.equipo_id = e.id
    `;

    const whereClauses = [];
    const queryParams = [];

    if (nivel) {
        whereClauses.push('a.nivel = ?');
        queryParams.push(nivel);
    }
    if (estado) {
        whereClauses.push('a.estado = ?');
        queryParams.push(estado);
    }
    if (tipo) {
        whereClauses.push('a.tipo = ?');
        queryParams.push(tipo);
    }
    if (equipo_id) {
        whereClauses.push('a.equipo_id = ?');
        queryParams.push(Number(equipo_id));
    }

    const textSearch = q || search;
    if (textSearch) {
        whereClauses.push('a.mensaje LIKE ?');
        queryParams.push(`%${textSearch}%`);
    }

    if (whereClauses.length > 0) {
        const clause = ' WHERE ' + whereClauses.join(' AND ');
        queryStr += clause;
        countQueryStr += clause;
    }

    // Ordenamiento
    const allowedSortFields = ['id', 'fecha_creacion', 'nivel', 'estado', 'tipo'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? `a.${sortBy}` : 'a.fecha_creacion';
    const activeSortOrder = (sortOrder && sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    queryStr += ` ORDER BY ${activeSortBy} ${activeSortOrder}`;

    // Paginación
    if (page) {
        const activePage = Math.max(1, parseInt(page) || 1);
        const activeLimit = Math.max(1, parseInt(limit) || 10);
        const offset = (activePage - 1) * activeLimit;

        // Obtener total
        const [countRows] = await db.query(countQueryStr, queryParams);
        const total = countRows[0].total;

        // Obtener lista con límites
        queryStr += ' LIMIT ? OFFSET ?';
        const [rows] = await db.query(queryStr, [...queryParams, activeLimit, offset]);

        res.json({
            data: rows,
            total,
            page: activePage,
            limit: activeLimit,
            totalPages: Math.ceil(total / activeLimit)
        });
    } else {
        // Comportamiento original sin paginación (con filtros aplicados)
        const [rows] = await db.query(queryStr, queryParams);
        res.json(rows);
    }
});

// Obtener alerta por ID
const getAlertaById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const [rows] = await db.query(
        `SELECT
            a.id,
            a.equipo_id,
            e.nombre AS equipo_nombre,
            a.tipo,
            a.mensaje,
            a.nivel,
            a.estado,
            a.fecha_creacion
        FROM alertas a
        INNER JOIN equipos e ON a.equipo_id = e.id
        WHERE a.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        const error = new Error('Alerta no encontrada');
        error.statusCode = 404;
        throw error;
    }

    res.json(rows[0]);
});

// Crear alerta
const crearAlerta = catchAsync(async (req, res) => {
    const {
        equipo_id,
        tipo,
        mensaje,
        nivel
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
        `INSERT INTO alertas
        (equipo_id, tipo, mensaje, nivel)
        VALUES (?, ?, ?, ?)`,
        [
            equipo_id,
            tipo,
            mensaje,
            nivel
        ]
    );

    res.status(201).json({
        mensaje: 'Alerta creada correctamente',
        id: resultado.insertId
    });
});

// Actualizar alerta
const actualizarAlerta = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la alerta existe
    const [existente] = await db.query(
        'SELECT id FROM alertas WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Alerta no encontrada');
        error.statusCode = 404;
        throw error;
    }

    const {
        equipo_id,
        tipo,
        mensaje,
        nivel,
        estado
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
        `UPDATE alertas
        SET equipo_id = COALESCE(?, equipo_id),
            tipo = COALESCE(?, tipo),
            mensaje = COALESCE(?, mensaje),
            nivel = COALESCE(?, nivel),
            estado = COALESCE(?, estado)
        WHERE id = ?`,
        [
            equipo_id || null,
            tipo || null,
            mensaje || null,
            nivel || null,
            estado || null,
            id
        ]
    );

    res.json({
        mensaje: 'Alerta actualizada correctamente'
    });
});

// Eliminar alerta
const eliminarAlerta = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la alerta existe
    const [existente] = await db.query(
        'SELECT id FROM alertas WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Alerta no encontrada');
        error.statusCode = 404;
        throw error;
    }

    await db.query(
        'DELETE FROM alertas WHERE id = ?',
        [id]
    );

    res.json({
        mensaje: 'Alerta eliminada correctamente'
    });
});

module.exports = {
    getAlertas,
    getAlertaById,
    crearAlerta,
    actualizarAlerta,
    eliminarAlerta
};
