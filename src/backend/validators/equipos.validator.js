const { body } = require('express-validator');

const crearEquipoValidador = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre del equipo es obligatorio')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres')
        .escape(),
    body('serial')
        .trim()
        .notEmpty().withMessage('El serial del equipo es obligatorio')
        .isLength({ max: 100 }).withMessage('El serial no puede exceder los 100 caracteres')
        .escape(),
    body('marca')
        .trim()
        .notEmpty().withMessage('La marca es obligatoria')
        .isLength({ max: 50 }).withMessage('La marca no puede exceder los 50 caracteres')
        .escape(),
    body('modelo')
        .trim()
        .notEmpty().withMessage('El modelo es obligatorio')
        .isLength({ max: 50 }).withMessage('El modelo no puede exceder los 50 caracteres')
        .escape(),
    body('procesador')
        .optional()
        .trim()
        .isLength({ max: 100 }).escape(),
    body('ram')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('almacenamiento')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('sistema_operativo')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('ubicacion')
        .optional()
        .trim()
        .isLength({ max: 100 }).escape(),
    body('estado')
        .optional()
        .trim()
        .isIn(['Activo', 'Inactivo', 'En Mantenimiento', 'De Baja']).withMessage('Estado de equipo inválido'),
    body('fecha_compra')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('La fecha de compra debe tener un formato de fecha válido (AAAA-MM-DD)')
];

const actualizarEquipoValidador = [
    body('nombre')
        .optional()
        .trim()
        .notEmpty().withMessage('El nombre del equipo no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres')
        .escape(),
    body('serial')
        .optional()
        .trim()
        .notEmpty().withMessage('El serial del equipo no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El serial no puede exceder los 100 caracteres')
        .escape(),
    body('marca')
        .optional()
        .trim()
        .notEmpty().withMessage('La marca no puede estar vacía')
        .isLength({ max: 50 }).withMessage('La marca no puede exceder los 50 caracteres')
        .escape(),
    body('modelo')
        .optional()
        .trim()
        .notEmpty().withMessage('El modelo no puede estar vacío')
        .isLength({ max: 50 }).withMessage('El modelo no puede exceder los 50 caracteres')
        .escape(),
    body('procesador')
        .optional()
        .trim()
        .isLength({ max: 100 }).escape(),
    body('ram')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('almacenamiento')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('sistema_operativo')
        .optional()
        .trim()
        .isLength({ max: 50 }).escape(),
    body('ubicacion')
        .optional()
        .trim()
        .isLength({ max: 100 }).escape(),
    body('estado')
        .optional()
        .trim()
        .isIn(['Activo', 'Inactivo', 'En Mantenimiento', 'De Baja']).withMessage('Estado de equipo inválido'),
    body('fecha_compra')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('La fecha de compra debe tener un formato de fecha válido (AAAA-MM-DD)')
];

module.exports = {
    crearEquipoValidador,
    actualizarEquipoValidador
};
