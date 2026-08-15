const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { getAuditorias, getAuditoriaById } = require('../controllers/auditoria.controller');

/**
 * @swagger
 * /api/auditoria:
 *   get:
 *     summary: Obtener todos los registros de auditoría (Solo Admin)
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de auditorías obtenida exitosamente
 *       403:
 *         description: Permisos insuficientes (Solo Admin)
 */
router.get('/', verificarToken, verificarRol(1), getAuditorias);

/**
 * @swagger
 * /api/auditoria/{id}:
 *   get:
 *     summary: Obtener detalle de un log de auditoría por ID (Solo Admin)
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro de auditoría
 *     responses:
 *       200:
 *         description: Detalle del registro de auditoría
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Registro no encontrado
 */
router.get('/:id', verificarToken, verificarRol(1), getAuditoriaById);

module.exports = router;
