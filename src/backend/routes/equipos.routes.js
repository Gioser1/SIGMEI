const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const { crearEquipoValidador, actualizarEquipoValidador } = require('../validators/equipos.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getEquipos,
    getEquipoById,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    syncHardware
} = require('../controllers/equipos.controller');

/**
 * @swagger
 * /api/equipos:
 *   get:
 *     summary: Obtener todos los equipos (Soporta paginación, filtros y búsqueda)
 *     tags: [Equipos]
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
 *           enum: [Activo, Inactivo, En Mantenimiento, De Baja]
 *         description: Filtrar por estado del equipo
 *       - in: query
 *         name: marca
 *         schema:
 *           type: string
 *         description: Filtrar por marca
 *       - in: query
 *         name: ubicacion
 *         schema:
 *           type: string
 *         description: Filtrar por ubicación
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto (nombre, serial, marca, modelo, ubicacion)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Lista de equipos obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getEquipos);

/**
 * @swagger
 * /api/equipos/{id}:
 *   get:
 *     summary: Obtener equipo por ID
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo
 *     responses:
 *       200:
 *         description: Detalle del equipo
 *       404:
 *         description: Equipo no encontrado
 */
router.get('/:id', verificarToken, getEquipoById);

/**
 * @swagger
 * /api/equipos:
 *   post:
 *     summary: Crear un nuevo equipo
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - serial
 *               - marca
 *               - modelo
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop HP Admin
 *               serial:
 *                 type: string
 *                 example: HP123456789
 *               marca:
 *                 type: string
 *                 example: HP
 *               modelo:
 *                 type: string
 *                 example: ProBook 450 G8
 *               procesador:
 *                 type: string
 *                 example: Intel Core i7
 *               ram:
 *                 type: string
 *                 example: 16GB
 *               almacenamiento:
 *                 type: string
 *                 example: 512GB SSD
 *               sistema_operativo:
 *                 type: string
 *                 example: Windows 11 Pro
 *               ubicacion:
 *                 type: string
 *                 example: Oficina de Tecnología
 *               estado:
 *                 type: string
 *                 example: Activo
 *                 enum: [Activo, Inactivo, En Mantenimiento, De Baja]
 *               fecha_compra:
 *                 type: string
 *                 format: date
 *                 example: 2026-01-15
 *     responses:
 *       201:
 *         description: Equipo creado correctamente
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Serial duplicado
 */
router.post('/', verificarToken, crearEquipoValidador, validarRequest, crearEquipo);

/**
 * @swagger
 * /api/equipos/{id}:
 *   put:
 *     summary: Actualizar equipo por ID
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Laptop HP Admin Modificada
 *               serial:
 *                 type: string
 *                 example: HP123456789
 *               marca:
 *                 type: string
 *                 example: HP
 *               modelo:
 *                 type: string
 *                 example: ProBook 450 G8
 *               estado:
 *                 type: string
 *                 example: En Mantenimiento
 *     responses:
 *       200:
 *         description: Equipo actualizado correctamente
 *       404:
 *         description: Equipo no encontrado
 */
router.put('/:id', verificarToken, actualizarEquipoValidador, validarRequest, actualizarEquipo);

/**
 * @swagger
 * /api/equipos/{id}:
 *   delete:
 *     summary: Eliminar equipo por ID
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del equipo a eliminar
 *     responses:
 *       200:
 *         description: Equipo eliminado correctamente
 *       404:
 *         description: Equipo no encontrado
 */
router.delete('/:id', verificarToken, eliminarEquipo);






/**
 * @swagger
 * /api/equipos/sync-hardware:
 *   post:
 *     summary: Sincronizar el hardware del equipo local del usuario logueado
 *     tags: [Equipos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hardware sincronizado
 */
router.post('/sync-hardware', verificarToken, syncHardware);

module.exports = router;