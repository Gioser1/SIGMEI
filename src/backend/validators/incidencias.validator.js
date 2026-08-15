const { body } = require('express-validator');

const crearIncidenciaValidador = [
    body('equipo_id')
        .notEmpty().withMessage('El equipo_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('usuario_id')
        .notEmpty().withMessage('El usuario_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El usuario_id debe ser un entero válido'),
    body('titulo')
        .trim()
        .notEmpty().withMessage('El título es obligatorio')
        .isLength({ max: 200 }).withMessage('El título no puede superar los 200 caracteres')
        .escape(),
    body('descripcion')
        .optional()
        .trim()
        .escape(),
    body('prioridad')
        .optional()
        .isIn(['baja', 'media', 'alta', 'critica', 'Baja', 'Media', 'Alta', 'Critica']).withMessage('Prioridad no válida'),
    body('estado')
        .optional()
        .isIn(['abierta', 'en_progreso', 'resuelta', 'cerrada', 'Abierta', 'En progreso', 'Resuelta']).withMessage('Estado no válido')
];

const actualizarIncidenciaValidador = [
    body('equipo_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('usuario_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El usuario_id debe ser un entero válido'),
    body('titulo')
        .optional()
        .trim()
        .notEmpty().withMessage('El título no puede estar vacío')
        .isLength({ max: 200 }).withMessage('El título no puede superar los 200 caracteres')
        .escape(),
    body('descripcion')
        .optional()
        .trim()
        .escape(),
    body('prioridad')
        .optional()
        .isIn(['baja', 'media', 'alta', 'critica', 'Baja', 'Media', 'Alta', 'Critica']).withMessage('Prioridad no válida'),
    body('estado')
        .optional()
        .isIn(['abierta', 'en_progreso', 'resuelta', 'cerrada', 'Abierta', 'En progreso', 'Resuelta']).withMessage('Estado no válido')
];

module.exports = {
    crearIncidenciaValidador,
    actualizarIncidenciaValidador
};
