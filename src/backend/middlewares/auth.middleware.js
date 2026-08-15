const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {

    try {

        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                mensaje: 'Acceso denegado. No se proporcionó token de autenticación'
            });
        }

        // Formato esperado: "Bearer <token>"
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                mensaje: 'Acceso denegado. Formato de token inválido'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adjuntar datos del usuario al request
        req.usuario = {
            id: decoded.id,
            correo: decoded.correo,
            rol_id: decoded.rol_id
        };

        next();

    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                mensaje: 'Token expirado. Inicie sesión nuevamente'
            });
        }

        return res.status(401).json({
            mensaje: 'Token inválido'
        });

    }
};

// Factory de middleware para verificar roles
// Uso: verificarRol(1, 2) permite solo roles 1 y 2
const verificarRol = (...rolesPermitidos) => {

    return (req, res, next) => {

        if (!req.usuario) {
            return res.status(401).json({
                mensaje: 'Debe autenticarse primero'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol_id)) {
            return res.status(403).json({
                mensaje: 'No tiene permisos para realizar esta acción'
            });
        }

        next();

    };
};

module.exports = {
    verificarToken,
    verificarRol
};
