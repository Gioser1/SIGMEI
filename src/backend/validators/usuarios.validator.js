const { body } = require('express-validator');

const crearUsuarioValidador = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .escape(),
    body('correo')
        .trim()
        .notEmpty().withMessage('El correo es obligatorio')
        .isEmail().withMessage('Debe ingresar un correo electrónico válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol_id')
        .notEmpty().withMessage('El rol_id es obligatorio')
        .isInt({ min: 1, max: 3 }).withMessage('El rol_id debe ser un número entero entre 1 y 3')
];

const actualizarUsuarioValidador = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .escape(),
    body('correo')
        .optional()
        .trim()
        .isEmail().withMessage('Debe ingresar un correo electrónico válido')
        .normalizeEmail(),
    body('password')
        .optional()
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol_id')
        .optional()
        .isInt({ min: 1, max: 3 }).withMessage('El rol_id debe ser un número entero entre 1 y 3')
];

module.exports = {
    crearUsuarioValidador,
    actualizarUsuarioValidador
};
