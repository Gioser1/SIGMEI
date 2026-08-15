const db = require('../config/database');
const { catchAsync } = require('../middlewares/error.middleware');

const getResumen = catchAsync(async (req, res) => {
    const [
        [totalEquipos],
        [equiposActivos],
        [incidenciasAbiertas],
        [incidenciasResueltas],
        [mantenimientosPendientes],
        [mantenimientosCompletados],
        [alertasCriticas]
    ] = await Promise.all([
        db.query('SELECT COUNT(*) AS total FROM equipos'),
        db.query("SELECT COUNT(*) AS total FROM equipos WHERE estado = 'Activo'"),
        db.query("SELECT COUNT(*) AS total FROM incidencias WHERE estado = 'Abierta'"),
        db.query("SELECT COUNT(*) AS total FROM incidencias WHERE estado = 'Resuelta'"),
        db.query("SELECT COUNT(*) AS total FROM mantenimientos WHERE estado = 'pendiente'"),
        db.query("SELECT COUNT(*) AS total FROM mantenimientos WHERE estado = 'completado'"),
        db.query("SELECT COUNT(*) AS total FROM alertas WHERE estado = 'activa'")
    ]);

    res.json({
        total_equipos: totalEquipos[0].total,
        equipos_activos: equiposActivos[0].total,
        incidencias_abiertas: incidenciasAbiertas[0].total,
        incidencias_resueltas: incidenciasResueltas[0].total,
        mantenimientos_pendientes: mantenimientosPendientes[0].total,
        mantenimientos_completados: mantenimientosCompletados[0].total,
        alertas_criticas: alertasCriticas[0].total
    });
});

module.exports = {
    getResumen
};