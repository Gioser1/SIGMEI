const { body } = require('express-validator');

const crearAlertaValidador = [
    body('equipo_id')
        .notEmpty().withMessage('El equipo_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('tipo')
        .notEmpty().withMessage('El tipo de alerta es obligatorio')
        .isIn(['cpu_alta', 'ram_alta', 'disco_lleno', 'temperatura_critica', 'otro']).withMessage('Tipo de alerta no válido'),
    body('mensaje')
        .trim()
        .notEmpty().withMessage('El mensaje es obligatorio')
        .isLength({ max: 500 }).withMessage('El mensaje no puede superar los 500 caracteres')
        .escape(),
    body('nivel')
        .notEmpty().withMessage('El nivel de alerta es obligatorio')
        .isIn(['info', 'advertencia', 'critica']).withMessage('Nivel de alerta no válido (info, advertencia, critica)'),
    body('estado')
        .optional()
        .isIn(['activa', 'reconocida', 'resuelta']).withMessage('Estado de alerta no válido')
];

const actualizarAlertaValidador = [
    body('equipo_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('tipo')
        .optional()
        .isIn(['cpu_alta', 'ram_alta', 'disco_lleno', 'temperatura_critica', 'otro']).withMessage('Tipo de alerta no válido'),
    body('mensaje')
        .optional()
        .trim()
        .notEmpty().withMessage('El mensaje no puede estar vacío')
        .isLength({ max: 500 }).withMessage('El mensaje no puede superar los 500 caracteres')
        .escape(),
    body('nivel')
        .optional()
        .isIn(['info', 'advertencia', 'critica']).withMessage('Nivel de alerta no válido (info, advertencia, critica)'),
    body('estado')
        .optional()
        .isIn(['activa', 'reconocida', 'resuelta']).withMessage('Estado de alerta no válido')
];

module.exports = {
    crearAlertaValidador,
    actualizarAlertaValidador
};
