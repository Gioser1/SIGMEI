const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');
const { registrarAccion } = require('../services/auditoria.service');

// Obtener todas las incidencias (soporta paginación, filtros, ordenamiento y búsqueda)
const getIncidencias = catchAsync(async (req, res) => {
    const { page, limit, estado, prioridad, equipo_id, usuario_id, q, search, sortBy, sortOrder } = req.query;

    let queryStr = `
        SELECT
            i.id,
            i.equipo_id,
            e.nombre AS equipo_nombre,
            e.serial AS equipo_serial,
            i.usuario_id,
            u.nombre AS usuario_nombre,
            i.titulo,
            i.descripcion,
            i.prioridad,
            i.estado,
            i.fecha_creacion
        FROM incidencias i
        INNER JOIN equipos e ON i.equipo_id = e.id
        INNER JOIN usuarios u ON i.usuario_id = u.id
    `;
    
    let countQueryStr = `
        SELECT COUNT(*) as total
        FROM incidencias i
        INNER JOIN equipos e ON i.equipo_id = e.id
        INNER JOIN usuarios u ON i.usuario_id = u.id
    `;

    const whereClauses = [];
    const queryParams = [];

    if (estado) {
        whereClauses.push('i.estado = ?');
        queryParams.push(estado);
    }
    if (prioridad) {
        whereClauses.push('i.prioridad = ?');
        queryParams.push(prioridad);
    }
    if (equipo_id) {
        whereClauses.push('i.equipo_id = ?');
        queryParams.push(Number(equipo_id));
    }
    if (usuario_id) {
        whereClauses.push('i.usuario_id = ?');
        queryParams.push(Number(usuario_id));
    }

    const textSearch = q || search;
    if (textSearch) {
        whereClauses.push('(i.titulo LIKE ? OR i.descripcion LIKE ?)');
        queryParams.push(`%${textSearch}%`, `%${textSearch}%`);
    }

    if (whereClauses.length > 0) {
        const clause = ' WHERE ' + whereClauses.join(' AND ');
        queryStr += clause;
        countQueryStr += clause;
    }

    // Ordenamiento
    const allowedSortFields = ['id', 'fecha_creacion', 'titulo', 'prioridad', 'estado'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? `i.${sortBy}` : 'i.fecha_creacion';
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

// Obtener incidencia por ID
const getIncidenciaById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const [rows] = await db.query(
        `SELECT
            i.id,
            i.equipo_id,
            e.nombre AS equipo_nombre,
            e.serial AS equipo_serial,
            i.usuario_id,
            u.nombre AS usuario_nombre,
            i.titulo,
            i.descripcion,
            i.prioridad,
            i.estado,
            i.fecha_creacion
        FROM incidencias i
        INNER JOIN equipos e ON i.equipo_id = e.id
        INNER JOIN usuarios u ON i.usuario_id = u.id
        WHERE i.id = ?`,
        [id]
    );

    if (rows.length === 0) {
        const error = new Error('Incidencia no encontrada');
        error.statusCode = 404;
        throw error;
    }

    res.json(rows[0]);
});

// Crear incidencia
const crearIncidencia = catchAsync(async (req, res) => {
    const {
        equipo_id,
        usuario_id,
        titulo,
        descripcion,
        prioridad
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

    // Verificar que el usuario existe
    const [usuario] = await db.query(
        'SELECT id FROM usuarios WHERE id = ?',
        [usuario_id]
    );

    if (usuario.length === 0) {
        const error = new Error('El usuario especificado no existe');
        error.statusCode = 404;
        throw error;
    }

    const [resultado] = await db.query(
        `INSERT INTO incidencias
        (equipo_id, usuario_id, titulo, descripcion, prioridad)
        VALUES (?, ?, ?, ?, ?)`,
        [
            equipo_id,
            usuario_id,
            titulo,
            descripcion || null,
            prioridad || 'media'
        ]
    );

    // Registrar auditoría
    await registrarAccion(
        req.usuario.id,
        'Creación de incidencia',
        'incidencias',
        `Se creó la incidencia "${titulo}" (ID: ${resultado.insertId}) para el equipo ID ${equipo_id}`
    );

    res.status(201).json({
        mensaje: 'Incidencia creada correctamente',
        id: resultado.insertId
    });
});

// Actualizar incidencia
const actualizarIncidencia = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la incidencia existe
    const [existente] = await db.query(
        'SELECT id FROM incidencias WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Incidencia no encontrada');
        error.statusCode = 404;
        throw error;
    }

    const {
        equipo_id,
        usuario_id,
        titulo,
        descripcion,
        prioridad,
        estado
    } = req.body;

    // Si se actualizan FKs, validarlas
    if (equipo_id) {
        const [eq] = await db.query('SELECT id FROM equipos WHERE id = ?', [equipo_id]);
        if (eq.length === 0) {
            const error = new Error('El equipo especificado no existe');
            error.statusCode = 404;
            throw error;
        }
    }

    if (usuario_id) {
        const [us] = await db.query('SELECT id FROM usuarios WHERE id = ?', [usuario_id]);
        if (us.length === 0) {
            const error = new Error('El usuario especificado no existe');
            error.statusCode = 404;
            throw error;
        }
    }

    await db.query(
        `UPDATE incidencias
        SET equipo_id = COALESCE(?, equipo_id),
            usuario_id = COALESCE(?, usuario_id),
            titulo = COALESCE(?, titulo),
            descripcion = COALESCE(?, descripcion),
            prioridad = COALESCE(?, prioridad),
            estado = COALESCE(?, estado)
        WHERE id = ?`,
        [
            equipo_id || null,
            usuario_id || null,
            titulo || null,
            descripcion || null,
            prioridad || null,
            estado || null,
            id
        ]
    );

    // Registrar auditoría
    await registrarAccion(
        req.usuario.id,
        'Actualización de incidencia',
        'incidencias',
        `Se actualizó la incidencia ID ${id}`
    );

    // Si se marcó como Resuelta o cerrada, insertar mensaje de cierre en el chat
    const estadoNorm = (estado || '').toLowerCase();
    if (estadoNorm === 'resuelta' || estadoNorm === 'cerrada') {
        try {
            const tecnicoNombre = req.usuario.nombre || 'Soporte Técnico';
            const mensajeCierre = `✅ Incidencia finalizada por ${tecnicoNombre}. ¡Gracias por contactar a soporte!`;

            const [resultado] = await db.query(
                `INSERT INTO mensajes_incidencias (incidencia_id, remitente_id, mensaje)
                 VALUES (?, ?, ?)`,
                [id, req.usuario.id, mensajeCierre]
            );

            const io = req.app.get('io');
            if (io) {
                const msgObj = {
                    id: resultado.insertId,
                    incidencia_id: parseInt(id),
                    remitente_id: req.usuario.id,
                    remitente_nombre: tecnicoNombre,
                    remitente_rol: req.usuario.rol_id,
                    mensaje: mensajeCierre,
                    es_cierre: true,
                    fecha_envio: new Date().toISOString()
                };
                io.to(`chat_${id}`).emit('nuevo_mensaje', msgObj);
                io.to(`chat_${id}`).emit('chat_finalizado', { incidencia_id: parseInt(id) });

                // Obtener el usuario dueño de la incidencia para notificarlo
                const [incRows] = await db.query('SELECT usuario_id FROM incidencias WHERE id = ?', [id]);
                if (incRows.length > 0) {
                    io.to(`user_${incRows[0].usuario_id}`).emit('chat_finalizado', { incidencia_id: parseInt(id) });
                }
            }
        } catch (chatErr) {
            console.warn('Error insertando mensaje de cierre en chat:', chatErr.message);
        }
    }

    res.json({
        mensaje: 'Incidencia actualizada correctamente'
    });
});

// Eliminar incidencia
const eliminarIncidencia = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar que la incidencia existe
    const [existente] = await db.query(
        'SELECT id FROM incidencias WHERE id = ?',
        [id]
    );

    if (existente.length === 0) {
        const error = new Error('Incidencia no encontrada');
        error.statusCode = 404;
        throw error;
    }

    await db.query(
        'DELETE FROM incidencias WHERE id = ?',
        [id]
    );

    res.json({
        mensaje: 'Incidencia eliminada correctamente'
    });
});

module.exports = {
    getIncidencias,
    getIncidenciaById,
    crearIncidencia,
    actualizarIncidencia,
    eliminarIncidencia
};
