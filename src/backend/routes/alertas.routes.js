const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearAlertaValidador, actualizarAlertaValidador } = require('../validators/alertas.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getAlertas,
    getAlertaById,
    crearAlerta,
    actualizarAlerta,
    eliminarAlerta
} = require('../controllers/alertas.controller');

/**
 * @swagger
 * /api/alertas:
 *   get:
 *     summary: Obtener todas las alertas (Soporta paginación, filtros y búsqueda)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página (ej. 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página (ej. 10)
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *           enum: [info, advertencia, critica]
 *         description: Filtrar por nivel de severidad
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activa, reconocida, resuelta]
 *         description: Filtrar por estado de la alerta
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [cpu_alta, ram_alta, disco_lleno, temperatura_critica, otro]
 *         description: Filtrar por tipo de alerta
 *       - in: query
 *         name: equipo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de equipo
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto en el mensaje
 *     responses:
 *       200:
 *         description: Lista de alertas obtenida
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getAlertas);

/**
 * @swagger
 * /api/alertas/{id}:
 *   get:
 *     summary: Obtener alerta por ID
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta
 *     responses:
 *       200:
 *         description: Detalle de la alerta
 *       404:
 *         description: Alerta no encontrada
 */
router.get('/:id', verificarToken, getAlertaById);

/**
 * @swagger
 * /api/alertas:
 *   post:
 *     summary: Crear una nueva alerta
 *     tags: [Alertas]
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
 *               - tipo
 *               - mensaje
 *               - nivel
 *             properties:
 *               equipo_id:
 *                 type: integer
 *                 example: 1
 *               tipo:
 *                 type: string
 *                 example: cpu_alta
 *                 enum: [cpu_alta, ram_alta, disco_lleno, temperatura_critica, otro]
 *               mensaje:
 *                 type: string
 *                 example: El uso de CPU ha superado el 95%
 *               nivel:
 *                 type: string
 *                 example: critica
 *                 enum: [info, advertencia, critica]
 *     responses:
 *       201:
 *         description: Alerta creada correctamente
 *       404:
 *         description: Equipo no encontrado
 */
router.post('/', verificarToken, crearAlertaValidador, validarRequest, crearAlerta);

/**
 * @swagger
 * /api/alertas/{id}:
 *   put:
 *     summary: Actualizar alerta por ID
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 example: reconocida
 *                 enum: [activa, reconocida, resuelta]
 *     responses:
 *       200:
 *         description: Alerta actualizada correctamente
 *       404:
 *         description: Alerta no encontrada
 */
router.put('/:id', verificarToken, actualizarAlertaValidador, validarRequest, actualizarAlerta);

/**
 * @swagger
 * /api/alertas/{id}:
 *   delete:
 *     summary: Eliminar alerta por ID
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la alerta a eliminar
 *     responses:
 *       200:
 *         description: Alerta eliminada correctamente
 *       404:
 *         description: Alerta no encontrada
 */
router.delete('/:id', verificarToken, eliminarAlerta);

module.exports = router;