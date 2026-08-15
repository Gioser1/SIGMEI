const db = require('../config/database');

const findAll = async (params = {}) => {
    const { page, limit, estado, marca, ubicacion, q, search, sortBy, sortOrder } = params;

    let queryStr = 'SELECT * FROM equipos';
    let countQueryStr = 'SELECT COUNT(*) as total FROM equipos';

    const whereClauses = [];
    const queryParams = [];

    if (estado) {
        whereClauses.push('estado = ?');
        queryParams.push(estado);
    }
    if (marca) {
        whereClauses.push('marca = ?');
        queryParams.push(marca);
    }
    if (ubicacion) {
        whereClauses.push('ubicacion = ?');
        queryParams.push(ubicacion);
    }

    const textSearch = q || search;
    if (textSearch) {
        whereClauses.push('(nombre LIKE ? OR serial LIKE ? OR marca LIKE ? OR modelo LIKE ? OR ubicacion LIKE ?)');
        const searchLike = `%${textSearch}%`;
        queryParams.push(searchLike, searchLike, searchLike, searchLike, searchLike);
    }

    if (whereClauses.length > 0) {
        const clause = ' WHERE ' + whereClauses.join(' AND ');
        queryStr += clause;
        countQueryStr += clause;
    }

    // Ordenamiento
    const allowedSortFields = ['id', 'nombre', 'serial', 'marca', 'modelo', 'estado', 'fecha_compra'];
    const activeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const activeSortOrder = (sortOrder && sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    queryStr += ` ORDER BY ${activeSortBy} ${activeSortOrder}`;

    // Paginación
    if (page) {
        const activePage = Math.max(1, parseInt(page) || 1);
        const activeLimit = Math.max(1, parseInt(limit) || 10);
        const offset = (activePage - 1) * activeLimit;

        // Total
        const [countRows] = await db.query(countQueryStr, queryParams);
        const total = countRows[0].total;

        // Lista
        queryStr += ' LIMIT ? OFFSET ?';
        const [rows] = await db.query(queryStr, [...queryParams, activeLimit, offset]);

        return {
            data: rows,
            total,
            page: activePage,
            limit: activeLimit,
            totalPages: Math.ceil(total / activeLimit)
        };
    } else {
        const [rows] = await db.query(queryStr, queryParams);
        return rows;
    }
};

const findById = async (id) => {
    const [rows] = await db.query('SELECT * FROM equipos WHERE id = ?', [id]);
    return rows[0] || null;
};

const findBySerial = async (serial) => {
    const [rows] = await db.query('SELECT * FROM equipos WHERE serial = ?', [serial]);
    return rows[0] || null;
};

const create = async (equipoData) => {
    const {
        nombre,
        serial,
        marca,
        modelo,
        procesador,
        ram,
        almacenamiento,
        sistema_operativo,
        ubicacion,
        estado,
        fecha_compra
    } = equipoData;

    const [resultado] = await db.query(
        `INSERT INTO equipos
        (
            nombre,
            serial,
            marca,
            modelo,
            procesador,
            ram,
            almacenamiento,
            sistema_operativo,
            ubicacion,
            estado,
            fecha_compra
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            nombre,
            serial,
            marca,
            modelo,
            procesador || null,
            ram || null,
            almacenamiento || null,
            sistema_operativo || null,
            ubicacion || null,
            estado || 'Activo',
            fecha_compra || null
        ]
    );

    return resultado.insertId;
};

const update = async (id, equipoData) => {
    const {
        nombre,
        serial,
        marca,
        modelo,
        procesador,
        ram,
        almacenamiento,
        sistema_operativo,
        ubicacion,
        estado,
        fecha_compra
    } = equipoData;

    await db.query(
        `UPDATE equipos
        SET
            nombre = ?,
            serial = ?,
            marca = ?,
            modelo = ?,
            procesador = ?,
            ram = ?,
            almacenamiento = ?,
            sistema_operativo = ?,
            ubicacion = ?,
            estado = ?,
            fecha_compra = ?
        WHERE id = ?`,
        [
            nombre,
            serial,
            marca,
            modelo,
            procesador,
            ram,
            almacenamiento,
            sistema_operativo,
            ubicacion,
            estado,
            fecha_compra,
            id
        ]
    );
};

const deleteById = async (id) => {
    await db.query('DELETE FROM equipos WHERE id = ?', [id]);
};

module.exports = {
    findAll,
    findById,
    findBySerial,
    create,
    update,
    deleteById
};
