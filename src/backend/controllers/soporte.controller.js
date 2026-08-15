const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');
const MeshCentralService = require('../services/meshCentralService');
const { registrarAccion } = require('../services/auditoria.service');

// Lista dispositivos MeshCentral que aún no están vinculados a ningún equipo (para que el admin los vincule)
const listarNodosDisponibles = catchAsync(async (req, res) => {
    const nodos = await MeshCentralService.listNodes();
    const [equiposVinculados] = await db.query('SELECT mesh_nodeid FROM equipos WHERE mesh_nodeid IS NOT NULL');
    const idsVinculados = new Set(equiposVinculados.map(e => e.mesh_nodeid));

    const disponibles = nodos.filter(n => !idsVinculados.has(n.nodeid));
    res.json({ nodos: disponibles });
});

// Vincula un nodeid de MeshCentral a un equipo existente (por su serial)
const vincularEquipo = catchAsync(async (req, res) => {
    const { serial, nodeid } = req.body;

    if (!serial || !nodeid) {
        const error = new Error('serial y nodeid son requeridos');
        error.statusCode = 400;
        throw error;
    }

    const [result] = await db.query('UPDATE equipos SET mesh_nodeid = ? WHERE serial = ?', [nodeid, serial]);

    if (result.affectedRows === 0) {
        const error = new Error('No se encontró un equipo con ese serial');
        error.statusCode = 404;
        throw error;
    }

    await registrarAccion(req.usuario.id, 'Vinculación de equipo remoto', 'soporte', `Serial ${serial} vinculado a nodeid MeshCentral`);

    res.json({ mensaje: 'Equipo vinculado correctamente' });
});
// El propio usuario vincula su PC automáticamente (usado desde su sesión)
const autoVincular = catchAsync(async (req, res) => {
    const usuario_id = req.usuario.id;

    // Buscar el equipo del usuario logueado
    const [equipoRows] = await db.query('SELECT id, serial, mesh_nodeid FROM equipos WHERE usuario_id = ?', [usuario_id]);
    if (equipoRows.length === 0) {
        const error = new Error('No tienes un equipo asignado en la plataforma');
        error.statusCode = 404;
        throw error;
    }
    const equipo = equipoRows[0];

    if (equipo.mesh_nodeid) {
        return res.json({ mensaje: 'Tu equipo ya está vinculado', yaVinculado: true });
    }

    // Traer nodos disponibles (sin vincular a ningún equipo)
    const nodos = await MeshCentralService.listNodes();
    const [vinculados] = await db.query('SELECT mesh_nodeid FROM equipos WHERE mesh_nodeid IS NOT NULL');
    const idsVinculados = new Set(vinculados.map(e => e.mesh_nodeid));
    const disponibles = nodos.filter(n => !idsVinculados.has(n.nodeid));

    if (disponibles.length === 0) {
        const error = new Error('No se detectó ningún agente nuevo. Verifica que hayas instalado y ejecutado el instalador.');
        error.statusCode = 404;
        throw error;
    }

    if (disponibles.length === 1) {
        // Caso simple: solo uno disponible, lo vinculamos directo
        await db.query('UPDATE equipos SET mesh_nodeid = ? WHERE id = ?', [disponibles[0].nodeid, equipo.id]);
        await registrarAccion(usuario_id, 'Auto-vinculación de equipo', 'soporte', `Serial ${equipo.serial} vinculado automáticamente`);
        return res.json({ mensaje: 'Equipo vinculado correctamente', vinculado: true });
    }

    // Varios disponibles: le devolvemos la lista para que elija
    res.json({ mensaje: 'Hay varios equipos nuevos, elige el tuyo', opciones: disponibles });
});

// Vincula eligiendo un nodeid específico de la lista de opciones (segundo paso si hubo ambigüedad)
const vincularConSeleccion = catchAsync(async (req, res) => {
    const usuario_id = req.usuario.id;
    const { nodeid } = req.body;

    if (!nodeid) {
        const error = new Error('nodeid es requerido');
        error.statusCode = 400;
        throw error;
    }

    const [equipoRows] = await db.query('SELECT id, serial FROM equipos WHERE usuario_id = ?', [usuario_id]);
    if (equipoRows.length === 0) {
        const error = new Error('No tienes un equipo asignado en la plataforma');
        error.statusCode = 404;
        throw error;
    }

    await db.query('UPDATE equipos SET mesh_nodeid = ? WHERE id = ?', [nodeid, equipoRows[0].id]);
    await registrarAccion(usuario_id, 'Vinculación de equipo (selección manual)', 'soporte', `Serial ${equipoRows[0].serial} vinculado`);
    res.json({ mensaje: 'Equipo vinculado correctamente' });
});
// Genera un link de conexión remota para el equipo (por serial)
const conectar = catchAsync(async (req, res) => {
    const { serial } = req.params;

    const [rows] = await db.query('SELECT mesh_nodeid, nombre FROM equipos WHERE serial = ?', [serial]);

    if (rows.length === 0) {
        const error = new Error('No se encontró un equipo con ese serial');
        error.statusCode = 404;
        throw error;
    }
    if (!rows[0].mesh_nodeid) {
        const error = new Error('Este equipo aún no está vinculado a MeshCentral');
        error.statusCode = 409;
        throw error;
    }

    const url = await MeshCentralService.generateShareLink(rows[0].mesh_nodeid, `tecnico-${req.usuario.id}`);

    await registrarAccion(req.usuario.id, 'Sesión de soporte remoto iniciada', 'soporte', `Conexión a equipo ${rows[0].nombre} (serial ${serial})`);

    res.json({ url });
});

module.exports = { listarNodosDisponibles, vincularEquipo, conectar, autoVincular, vincularConSeleccion };