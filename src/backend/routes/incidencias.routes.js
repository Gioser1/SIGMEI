const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearIncidenciaValidador, actualizarIncidenciaValidador } = require('../validators/incidencias.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getIncidencias,
    getIncidenciaById,
    crearIncidencia,
    actualizarIncidencia,
    eliminarIncidencia
} = require('../controllers/incidencias.controller');

/**
 * @swagger
 * /api/incidencias:
 *   get:
 *     summary: Obtener todas las incidencias (Soporta paginación, filtros y búsqueda)
 *     tags: [Incidencias]
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
 *           enum: [abierta, en_progreso, resuelta, cerrada]
 *         description: Filtrar por estado
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *           enum: [baja, media, alta, critica]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: equipo_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de equipo
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de usuario asignado
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto (titulo, descripcion)
 *     responses:
 *       200:
 *         description: Lista de incidencias obtenida
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getIncidencias);

/**
 * @swagger
 * /api/incidencias/{id}:
 *   get:
 *     summary: Obtener incidencia por ID
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia
 *     responses:
 *       200:
 *         description: Detalle de la incidencia
 *       404:
 *         description: Incidencia no encontrada
 */
router.get('/:id', verificarToken, getIncidenciaById);

/**
 * @swagger
 * /api/incidencias:
 *   post:
 *     summary: Crear una nueva incidencia
 *     tags: [Incidencias]
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
 *               - titulo
 *             properties:
 *               equipo_id:
 *                 type: integer
 *                 example: 1
 *               usuario_id:
 *                 type: integer
 *                 example: 1
 *               titulo:
 *                 type: string
 *                 example: Pantalla rota
 *               descripcion:
 *                 type: string
 *                 example: La pantalla parpadea y tiene líneas horizontales
 *               prioridad:
 *                 type: string
 *                 example: alta
 *                 enum: [baja, media, alta, critica]
 *     responses:
 *       201:
 *         description: Incidencia creada correctamente
 *       404:
 *         description: Equipo o usuario no encontrado
 */
router.post('/', verificarToken, crearIncidenciaValidador, validarRequest, crearIncidencia);

/**
 * @swagger
 * /api/incidencias/{id}:
 *   put:
 *     summary: Actualizar incidencia por ID
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Pantalla rota (HP ProBook)
 *               estado:
 *                 type: string
 *                 example: en_progreso
 *                 enum: [abierta, en_progreso, resuelta, cerrada]
 *               prioridad:
 *                 type: string
 *                 example: critica
 *     responses:
 *       200:
 *         description: Incidencia actualizada correctamente
 *       404:
 *         description: Incidencia no encontrada
 */
router.put('/:id', verificarToken, actualizarIncidenciaValidador, validarRequest, actualizarIncidencia);

/**
 * @swagger
 * /api/incidencias/{id}:
 *   delete:
 *     summary: Eliminar incidencia por ID
 *     tags: [Incidencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la incidencia a eliminar
 *     responses:
 *       200:
 *         description: Incidencia eliminada correctamente
 *       404:
 *         description: Incidencia no encontrada
 */
router.delete('/:id', verificarToken, eliminarIncidencia);

module.exports = router;