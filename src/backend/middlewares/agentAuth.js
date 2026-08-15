const AgentAuthService = require('../services/AgentAuthService');

/**
 * Middleware para proteger rutas exclusivas de los Agentes Windows.
 * Requiere los headers:
 * - X-Agent-Key: La API Key generada para el equipo.
 * - X-Equipo-Id: El ID del equipo en la base de datos.
 */
const requireAgentAuth = async (req, res, next) => {
    const apiKey = req.header('X-Agent-Key');
    const equipoId = req.header('X-Equipo-Id');

    if (!apiKey || !equipoId) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Faltan credenciales de agente (X-Agent-Key o X-Equipo-Id).'
        });
    }

    try {
        const isValid = await AgentAuthService.validateApiKeyForEquipo(equipoId, apiKey);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. API Key de agente inválida o equipo no registrado.'
            });
        }

        // Inyectar el equipoId en el request para que el controlador lo use con seguridad
        req.equipoId = parseInt(equipoId, 10);
        next();
    } catch (error) {
        console.error('Error en middleware de agente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno validando la identidad del agente.'
        });
    }
};

module.exports = { requireAgentAuth };
