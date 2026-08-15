const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { getResumen } = require('../controllers/dashboard.controller');

/**
 * @swagger
 * /api/dashboard/resumen:
 *   get:
 *     summary: Obtener resumen estadístico del sistema (Dashboard)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen estadístico obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_equipos:
 *                   type: integer
 *                   example: 15
 *                 equipos_activos:
 *                   type: integer
 *                   example: 12
 *                 incidencias_abiertas:
 *                   type: integer
 *                   example: 3
 *                 incidencias_resueltas:
 *                   type: integer
 *                   example: 8
 *                 mantenimientos_pendientes:
 *                   type: integer
 *                   example: 5
 *                 mantenimientos_completados:
 *                   type: integer
 *                   example: 10
 *                 alertas_criticas:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: No autorizado
 */
router.get('/resumen', verificarToken, getResumen);

module.exports = router;
