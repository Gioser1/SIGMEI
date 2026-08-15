const EquipoService = require('../services/equipos.service');
const { catchAsync } = require('../middlewares/error.middleware');
const { registrarAccion } = require('../services/auditoria.service');

// Obtener todos los equipos (soporta paginación, filtros, ordenamiento y búsqueda)
const getEquipos = catchAsync(async (req, res) => {
    const result = await EquipoService.obtenerTodos(req.query);
    res.json(result);
});

// Obtener un equipo por ID
const getEquipoById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const equipo = await EquipoService.obtenerPorId(id);
    res.json(equipo);
});

// Crear equipo
const crearEquipo = catchAsync(async (req, res) => {
    const id = await EquipoService.crear(req.body);

    // Registrar en auditoría
    await registrarAccion(
        req.usuario.id,
        'Creación de equipo',
        'equipos',
        `Se creó el equipo "${req.body.nombre}" con serial "${req.body.serial}" (ID: ${id})`
    );

    res.status(201).json({
        mensaje: 'Equipo creado correctamente',
        id
    });
});

// Actualizar equipo (con log de auditoría)
const actualizarEquipo = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    await EquipoService.actualizar(id, req.body);

    // Registrar en auditoría
    await registrarAccion(
        req.usuario.id,
        'Actualización de equipo',
        'equipos',
        `Se actualizó el equipo ID ${id}`
    );

    res.json({
        mensaje: 'Equipo actualizado correctamente'
    });
});

// Eliminar equipo (con log de auditoría)
const eliminarEquipo = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Obtener datos del equipo antes de eliminarlo para la auditoría
    const equipo = await EquipoService.obtenerPorId(id);

    await EquipoService.eliminar(id);

    // Registrar en auditoría
    await registrarAccion(
        req.usuario.id,
        'Eliminación de equipo',
        'equipos',
        `Se eliminó el equipo "${equipo.nombre}" con serial "${equipo.serial}" (ID: ${id})`
    );

    res.json({
        mensaje: 'Equipo eliminado correctamente'
    });
});

// Sincronizar hardware local al equipo del usuario logueado
const db = require('../config/database'); // Make sure db is imported if not globally available in service
const syncHardware = catchAsync(async (req, res) => {
    const usuario_id = req.usuario.id;
    const hardwareData = req.body;

    // Buscar el equipo asociado a este usuario
    let [rows] = await db.query('SELECT id, nombre, serial FROM equipos WHERE usuario_id = ?', [usuario_id]);
    let equipoId;
    let equipoSerial;
    let equipoNombre;

    if (rows.length === 0) {
        const [uRows] = await db.query('SELECT nombre FROM usuarios WHERE id = ?', [usuario_id]);
        const nombreUser = uRows[0]?.nombre || 'Usuario';
        equipoSerial = `pc${nombreUser.replace(/\s+/g, '').toLowerCase()}${Math.floor(1000 + Math.random() * 9000)}`;
        equipoNombre = `PC de ${nombreUser}`;
        const [newEq] = await db.query(
            `INSERT INTO equipos (nombre, serial, estado, usuario_id) VALUES (?, ?, ?, ?)`,
            [equipoNombre, equipoSerial, 'Activo', usuario_id]
        );
        equipoId = newEq.insertId;
    } else {
        equipoId = rows[0].id;
        equipoSerial = rows[0].serial;
        equipoNombre = rows[0].nombre;
    }

    // Construir los strings de actualización a partir del objeto estructurado que envía el frontend
    const procesador = hardwareData.cpu?.name || null;
    const gpu = hardwareData.gpu?.name || null;
    const ramObj = hardwareData.ram?.name || 'Memoria RAM';
    
    // Almacenamiento puede ser un array o múltiple
    let almacenamientoStr = null;
    if (hardwareData.storage && Array.isArray(hardwareData.storage)) {
        almacenamientoStr = hardwareData.storage.map(d => d.name).join(', ');
    }
    
    // Marca y Modelo desde Motherboard
    const mbName = hardwareData.motherboard?.name || null;

    // Solo actualizamos si hay cambios significativos
    await db.query(
        `UPDATE equipos
        SET
            procesador = ?,
            marca = ?,
            modelo = ?,
            ram = ?,
            almacenamiento = ?
        WHERE id = ?`,
        [
            procesador,
            mbName ? mbName.split(' ')[0] : null, // Marca aproximada
            mbName, // Modelo
            ramObj,
            almacenamientoStr,
            equipoId
        ]
    );

    res.json({
        mensaje: 'Hardware sincronizado exitosamente con tu equipo',
        equipoId,
        equipoNombre,
        equipoSerial
    });
});

module.exports = {
    getEquipos,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    syncHardware
};