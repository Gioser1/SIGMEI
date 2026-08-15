const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearMantenimientoValidador, actualizarMantenimientoValidador } = require('../validators/mantenimientos.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getMantenimientos,
    getMantenimientoById,
    crearMantenimiento,
    actualizarMantenimiento,
    eliminarMantenimiento
} = require('../controllers/mantenimientos.controller');

/**
 * @swagger
 * /api/mantenimientos:
 *   get:
 *     summary: Obtener todos los mantenimientos (Soporta paginación, filtros y búsqueda)
 *     tags: [Mantenimientos]
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
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, en_progreso, completado, cancelado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [preventivo, correctivo]
 *         description: Filtrar por tipo de mantenimiento
 *       - in: query
 *         name: equipo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de equipo
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto (descripcion, observaciones)
 *     responses:
 *       200:
 *         description: Lista de mantenimientos obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getMantenimientos);

/**
 * @swagger
 * /api/mantenimientos/{id}:
 *   get:
 *     summary: Obtener mantenimiento por ID
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del mantenimiento
 *     responses:
 *       200:
 *         description: Detalle del mantenimiento
 *       404:
 *         description: Mantenimiento no encontrado
 */
router.get('/:id', verificarToken, getMantenimientoById);

/**
 * @swagger
 * /api/mantenimientos:
 *   post:
 *     summary: Crear un nuevo mantenimiento
 *     tags: [Mantenimientos]
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
 *               - usuario_id
 *               - tipo
 *               - descripcion
 *               - fecha_programada
 *             properties:
 *               equipo_id:
 *                 type: integer
 *                 example: 1
 *               usuario_id:
 *                 type: integer
 *                 example: 1
 *               tipo:
 *                 type: string
 *                 example: preventivo
 *                 enum: [preventivo, correctivo]
 *               descripcion:
 *                 type: string
 *                 example: Limpieza interna y cambio de pasta térmica
 *               fecha_programada:
 *                 type: string
 *                 format: date
 *                 example: 2026-07-01
 *               observaciones:
 *                 type: string
 *                 example: Se requiere kit de destornilladores de precisión
 *     responses:
 *       201:
 *         description: Mantenimiento creado correctamente
 *       404:
 *         description: Equipo o usuario no encontrado
 */
router.post('/', verificarToken, crearMantenimientoValidador, validarRequest, crearMantenimiento);

/**
 * @swagger
 * /api/mantenimientos/{id}:
 *   put:
 *     summary: Actualizar mantenimiento por ID
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del mantenimiento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 example: completado
 *                 enum: [pendiente, en_progreso, completado, cancelado]
 *               fecha_realizada:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-25
 *               observaciones:
 *                 type: string
 *                 example: Se realizó la limpieza correctamente y se aplicó pasta térmica MX-4.
 *     responses:
 *       200:
 *         description: Mantenimiento actualizado correctamente
 *       404:
 *         description: Mantenimiento no encontrado
 */
router.put('/:id', verificarToken, actualizarMantenimientoValidador, validarRequest, actualizarMantenimiento);

/**
 * @swagger
 * /api/mantenimientos/{id}:
 *   delete:
 *     summary: Eliminar mantenimiento por ID
 *     tags: [Mantenimientos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del mantenimiento a eliminar
 *     responses:
 *       200:
 *         description: Mantenimiento eliminado correctamente
 *       404:
 *         description: Mantenimiento no encontrado
 */
router.delete('/:id', verificarToken, eliminarMantenimiento);

module.exports = router;