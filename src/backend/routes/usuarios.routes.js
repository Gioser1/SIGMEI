const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { crearUsuarioValidador, actualizarUsuarioValidador } = require('../validators/usuarios.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

const {
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuarios.controller');

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/', verificarToken, getUsuarios);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Detalle del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', verificarToken, getUsuarioById);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario (Solo Admin)
 *     tags: [Usuarios]
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
 *               - correo
 *               - password
 *               - rol_id
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Carlos López
 *               correo:
 *                 type: string
 *                 example: carlos.lopez@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               rol_id:
 *                 type: integer
 *                 example: 2
 *                 description: "1 = Admin, 2 = Técnico, 3 = Usuario"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       403:
 *         description: Permisos insuficientes (Requiere rol Admin)
 */
router.post('/', verificarToken, verificarRol(1), crearUsuarioValidador, validarRequest, crearUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario por ID (Solo Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Carlos López Modificado
 *               correo:
 *                 type: string
 *                 example: carlos.m@example.com
 *               password:
 *                 type: string
 *                 example: nuevaPassword123
 *               rol_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/:id', verificarToken, verificarRol(1), actualizarUsuarioValidador, validarRequest, actualizarUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario por ID (Solo Admin)
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       403:
 *         description: Permisos insuficientes
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:id', verificarToken, verificarRol(1), eliminarUsuario);

module.exports = router;
