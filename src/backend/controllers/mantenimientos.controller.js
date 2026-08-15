const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

// Obtener todos los mantenimientos (soporta paginación, filtros, ordenamiento y búsqueda)
const getMantenimientos = catchAsync(async (req, res) => {
    const { page, limit, estado, tipo, equipo_id, q, search, sortBy, sortOrder } = req.query;

    let queryStr = `
        SELECT
            m.id,
            m.equipo_id,
            e.nombre AS equipo_nombre,
            m.tecnico_id,
            u.nombre AS tecnico_nombre,
            m.tipo,
            m.descripcion,
            m.fecha,
            m.estado
        FROM mantenimientos m
        INNER JOIN equipos e ON m.equipo_id = e.id
        INNER JOIN usuarios u ON m.tecnico_id = u.id
    `;
    
    let countQueryStr = `
        SELECT COUNT(*) as total
        FROM mantenimientos m
        INNER JOIN equipos e ON m.equipo_id = e.id
        INNER JOIN usuarios u ON m.tecnico_id = u.id
    `;

    const whereClauses = [];
    const queryParams = [];

    if (estado) {
        whereClauses.push('m.estado = ?');
        queryParams.push(estado);
    }
    if (tipo) {
        whereClauses.push('m.tipo = ?');
        queryParams.push(tipo);
    }
    if (equipo_id) {
        whereClauses.push('m.equipo_id = ?');
        queryParams.push(Number(equipo_id));
    }

    const textSearch = q || search;
    if (textSearch) {
        whereClauses.push('(m.descripcion LIKE ?)');
        queryParams.push(`%${textSearch}%`);
    }

    if (whereClauses.length > 0) {
        const clause = ' WHERE ' + whereClauses.join(' AND ');
        queryStr += clause;
        countQueryStr += clause;
    }

    // Ordenamiento
    const allowedSortFields = ['id', 'fecha', 'estado', 'tipo'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? `m.${sortBy}` : 'm.fecha';
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

// Obtener mantenimiento por ID
const getMantenimientoById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const [rows] = await db.query(
        `SELECT
            m.id,
            m.equipo_id,
            e.nombre AS equipo_nombre,
            m.tecnico_id,
            u.nombre AS tecnico_nombre,
            m.tipo,
            m.descripcion,
            m.fecha,
            m.estado
        FROM mantenimientos m
        INNER JOIN equipos e ON m.equipo_id = e.id
        INNER JOIN usuarios u ON m.tecnico_id = u.id
        WHERE m.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        const error = new Error('Mantenimiento no encontrado');
        error.statusCode = 404;
        throw error;
    }

    res.json(rows[0]);
});

// Crear mantenimiento
const crearMantenimiento = catchAsync(async (req, res) => {
    const {
        equipo_id,
        tecnico_id,
        tipo,
        descripcion,
        fecha
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

    // Verificar que el técnico existe
    const [tecnico] = await db.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [tecnico_id]
    );

    if (tecnico.length === 0) {
        const error = new Error('El técnico especificado no existe');
        error.statusCode = 404;
        throw error;
    }

    const [resultado] = await db.query(
        `INSERT INTO mantenimientos
        (equipo_id, tecnico_id, tipo, descripcion, fecha)
        VALUES (?, ?, ?, ?, ?)`,
        [
            equipo_id,
            tecnico_id,
            tipo,
            descripcion,
            fecha || null
        ]
    );

    res.status(201).json({
        mensaje: 'Mantenimiento creado correctamente',
        id: resultado.insertId
    });
});

// Actualizar mantenimiento
const actualizarMantenimiento = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que el mantenimiento existe
    const [existente] = await db.query(
        'SELECT id FROM mantenimientos WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Mantenimiento no encontrado');
        error.statusCode = 404;
        throw error;
    }

    const {
        equipo_id,
        tecnico_id,
        tipo,
        descripcion,
        fecha,
        estado
    } = req.body;

    // Validar FKs si vienen
    if (equipo_id) {
        const [eq] = await db.query('SELECT id FROM equipos WHERE id = ?', [equipo_id]);
        if (eq.length === 0) {
            const error = new Error('El equipo especificado no existe');
            error.statusCode = 404;
            throw error;
        }
    }

    if (tecnico_id) {
        const [us] = await db.query('SELECT id FROM usuarios WHERE id = ?', [tecnico_id]);
        if (us.length === 0) {
            const error = new Error('El técnico especificado no existe');
            error.statusCode = 404;
            throw error;
        }
    }

    await db.query(
        `UPDATE mantenimientos
        SET equipo_id = COALESCE(?, equipo_id),
            tecnico_id = COALESCE(?, tecnico_id),
            tipo = COALESCE(?, tipo),
            descripcion = COALESCE(?, descripcion),
            fecha = COALESCE(?, fecha),
            estado = COALESCE(?, estado)
        WHERE id = ?`,
        [
            equipo_id || null,
            tecnico_id || null,
            tipo || null,
            descripcion || null,
            fecha || null,
            estado || null,
            id
        ]
    );

    res.json({
        mensaje: 'Mantenimiento actualizado correctamente'
    });
});

// Eliminar mantenimiento
const eliminarMantenimiento = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que el mantenimiento existe
    const [existente] = await db.query(
        'SELECT id FROM mantenimientos WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Mantenimiento no encontrado');
        error.statusCode = 404;
        throw error;
    }

    await db.query(
        'DELETE FROM mantenimientos WHERE id = ?',
        [id]
    );

    res.json({
        mensaje: 'Mantenimiento eliminado correctamente'
    });
});

module.exports = {
    getMantenimientos,
    getMantenimientoById,
    crearMantenimiento,
    actualizarMantenimiento,
    eliminarMantenimiento
};
