const { validationResult } = require('express-validator');

// Middleware reutilizable para capturar y lanzar errores de validación de express-validator
const validarRequest = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        const error = new Error('Error de validación');
        error.statusCode = 400;
        // Mapear los errores para que sean legibles y estructurados
        error.validationErrors = errores.array().map(err => ({
            campo: err.path,
            mensaje: err.msg
        }));
        return next(error);
    }
    next();
};

module.exports = {
    validarRequest
};
