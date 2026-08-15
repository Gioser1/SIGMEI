// Wrapper para atrapar errores de funciones asíncronas en controladores y pasarlos al next()
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Middleware global de manejo de errores
const errorHandler = (err, req, res, next) => {
    // Registrar el error en la consola para depuración
    console.error('❌ Error capturado por el middleware global:', err);

    let statusCode = err.statusCode || 500;
    let mensaje = err.message || 'Error interno del servidor';
    let errores = err.validationErrors || undefined;

    // Manejo de errores específicos de JWT
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        mensaje = 'Token expirado. Inicie sesión nuevamente';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        mensaje = 'Token inválido';
    }

    // Manejo de errores específicos de MySQL (mysql2)
    if (err.code) {
        switch (err.code) {
            case 'ER_DUP_ENTRY':
                statusCode = 409;
                mensaje = 'Entrada duplicada. El registro ya existe.';
                if (err.sqlMessage) {
                    mensaje = `Registro duplicado: ${err.sqlMessage}`;
                }
                break;
            case 'ER_NO_REFERENCED_ROW_2':
            case 'ER_NO_REFERENCED_ROW':
                statusCode = 400;
                mensaje = 'Operación inválida. Uno de los IDs referenciados no existe.';
                break;
            case 'ER_ROW_IS_REFERENCED_2':
            case 'ER_ROW_IS_REFERENCED':
                statusCode = 409;
                mensaje = 'No se puede eliminar o actualizar el registro porque está siendo referenciado por otra entidad.';
                break;
            default:
                // No exponer detalles internos de SQL en producción, pero es un proyecto de grado, se puede incluir el sqlMessage de forma amigable
                statusCode = 500;
                mensaje = `Error en la base de datos: ${err.sqlMessage || err.message}`;
                break;
        }
    }

    res.status(statusCode).json({
        mensaje,
        ...(errores && { errores })
    });
};

module.exports = {
    catchAsync,
    errorHandler
};
