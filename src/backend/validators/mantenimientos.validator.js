const { body } = require('express-validator');

const crearMantenimientoValidador = [
    body('equipo_id')
        .notEmpty().withMessage('El equipo_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('usuario_id')
        .notEmpty().withMessage('El usuario_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El usuario_id debe ser un entero válido'),
    body('tipo')
        .notEmpty().withMessage('El tipo es obligatorio')
        .isIn(['preventivo', 'correctivo']).withMessage('Tipo no válido (preventivo, correctivo)'),
    body('descripcion')
        .trim()
        .notEmpty().withMessage('La descripción es obligatoria')
        .escape(),
    body('fecha_programada')
        .notEmpty().withMessage('La fecha programada es obligatoria')
        .isISO8601().withMessage('Debe ingresar un formato de fecha programada válido (AAAA-MM-DD)'),
    body('fecha_realizada')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Debe ingresar un formato de fecha realizada válido (AAAA-MM-DD)'),
    body('estado')
        .optional()
        .isIn(['pendiente', 'en_progreso', 'completado', 'cancelado']).withMessage('Estado no válido (pendiente, en_progreso, completado, cancelado)'),
    body('observaciones')
        .optional()
        .trim()
        .escape()
];

const actualizarMantenimientoValidador = [
    body('equipo_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('usuario_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El usuario_id debe ser un entero válido'),
    body('tipo')
        .optional()
        .isIn(['preventivo', 'correctivo']).withMessage('Tipo no válido (preventivo, correctivo)'),
    body('descripcion')
        .optional()
        .trim()
        .notEmpty().withMessage('La descripción no puede estar vacía')
        .escape(),
    body('fecha_programada')
        .optional()
        .isISO8601().withMessage('Debe ingresar un formato de fecha programada válido (AAAA-MM-DD)'),
    body('fecha_realizada')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Debe ingresar un formato de fecha realizada válido (AAAA-MM-DD)'),
    body('estado')
        .optional()
        .isIn(['pendiente', 'en_progreso', 'completado', 'cancelado']).withMessage('Estado no válido (pendiente, en_progreso, completado, cancelado)'),
    body('observaciones')
        .optional()
        .trim()
        .escape()
];

module.exports = {
    crearMantenimientoValidador,
    actualizarMantenimientoValidador
};
