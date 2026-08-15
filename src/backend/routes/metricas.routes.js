const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearMetricaValidador, actualizarMetricaValidador } = require('../validators/metricas.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getMetricas,
    getMetricaById,
    crearMetrica,
    actualizarMetrica,
    eliminarMetrica
} = require('../controllers/metricas.controller');

/**
 * @swagger
 * /api/metricas:
 *   get:
 *     summary: Obtener todas las métricas
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de métricas obtenida
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getMetricas);

/**
 * @swagger
 * /api/metricas/{id}:
 *   get:
 *     summary: Obtener métrica por ID
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de métrica
 *     responses:
 *       200:
 *         description: Detalle del registro de métricas
 *       404:
 *         description: Métrica no encontrada
 */
router.get('/:id', verificarToken, getMetricaById);

/**
 * @swagger
 * /api/metricas:
 *   post:
 *     summary: Registrar una nueva métrica de hardware
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipo_id
 *             properties:
 *               equipo_id:
 *                 type: integer
 *                 example: 1
 *               cpu_uso:
 *                 type: number
 *                 format: float
 *                 example: 45.2
 *                 description: Porcentaje de uso de CPU (0 a 100)
 *               ram_uso:
 *                 type: number
 *                 format: float
 *                 example: 72.8
 *                 description: Porcentaje de uso de RAM (0 a 100)
 *               disco_uso:
 *                 type: number
 *                 format: float
 *                 example: 60.1
 *                 description: Porcentaje de uso de Disco (0 a 100)
 *               temperatura_cpu:
 *                 type: number
 *                 format: float
 *                 example: 58.5
 *                 description: Temperatura de CPU en grados Celsius (0 a 150)
 *     responses:
 *       201:
 *         description: Métrica registrada correctamente
 *       400:
 *         description: Valores fuera de rango o inválidos
 *       404:
 *         description: Equipo no encontrado
 */
router.post('/', verificarToken, crearMetricaValidador, validarRequest, crearMetrica);

/**
 * @swagger
 * /api/metricas/{id}:
 *   put:
 *     summary: Actualizar registro de métrica por ID
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la métrica a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpu_uso:
 *                 type: number
 *                 format: float
 *                 example: 50.0
 *     responses:
 *       200:
 *         description: Métrica actualizada correctamente
 *       404:
 *         description: Métrica no encontrada
 */
router.put('/:id', verificarToken, actualizarMetricaValidador, validarRequest, actualizarMetrica);

/**
 * @swagger
 * /api/metricas/{id}:
 *   delete:
 *     summary: Eliminar registro de métrica por ID
 *     tags: [Métricas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la métrica a eliminar
 *     responses:
 *       200:
 *         description: Registro de métricas eliminado correctamente
 *       404:
 *         description: Registro no encontrado
 */
router.delete('/:id', verificarToken, eliminarMetrica);

module.exports = router;