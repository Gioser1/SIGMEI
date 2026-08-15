const express = require('express');
const router = express.Router();
const { registro, login } = require('../controllers/auth.controller');
const { registroValidador, loginValidador } = require('../validators/auth.validator');
const { validarRequest } = require('../middlewares/validation.middleware');

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Autenticación]
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               correo:
 *                 type: string
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               rol_id:
 *                 type: integer
 *                 example: 3
 *                 description: "1 = Admin, 2 = Técnico, 3 = Usuario"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El correo ya existe
 */
router.post('/registro', registroValidador, validarRequest, registro);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de un usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *             properties:
 *               correo:
 *                 type: string
 *                 example: juan.perez@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso y retorno de JWT token
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginValidador, validarRequest, login);

module.exports = router;
