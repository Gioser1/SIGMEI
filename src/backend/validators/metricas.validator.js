const { body } = require('express-validator');

const crearMetricaValidador = [
    body('equipo_id')
        .notEmpty().withMessage('El equipo_id es obligatorio')
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('cpu_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de CPU debe ser un número decimal entre 0 y 100'),
    body('ram_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de RAM debe ser un número decimal entre 0 y 100'),
    body('disco_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de disco debe ser un número decimal entre 0 y 100'),
    body('temperatura_cpu')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 150.0 }).withMessage('La temperatura de CPU debe ser un número decimal entre 0 y 150')
];

const actualizarMetricaValidador = [
    body('equipo_id')
        .optional()
        .isInt({ min: 1 }).withMessage('El equipo_id debe ser un entero válido'),
    body('cpu_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de CPU debe ser un número decimal entre 0 y 100'),
    body('ram_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de RAM debe ser un número decimal entre 0 y 100'),
    body('disco_uso')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 100.0 }).withMessage('El uso de disco debe ser un número decimal entre 0 y 100'),
    body('temperatura_cpu')
        .optional({ nullable: true })
        .isFloat({ min: 0.0, max: 150.0 }).withMessage('La temperatura de CPU debe ser un número decimal entre 0 y 150')
];

module.exports = {
    crearMetricaValidador,
    actualizarMetricaValidador
};
