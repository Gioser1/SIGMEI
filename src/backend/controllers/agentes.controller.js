const AgentAuthService = require('../services/AgentAuthService');
const AgentesModel = require('../models/agentes.model');
const InventoryDiffService = require('../services/InventoryDiffService');

/**
 * Registra o re-registra un agente para un equipo específico (Usado desde el Dashboard web por el Admin)
 * POST /api/agentes/register
 */
const registerAgent = async (req, res) => {
    try {
        const { equipo_id } = req.body;

        if (!equipo_id) {
            return res.status(400).json({ success: false, message: 'equipo_id es requerido' });
        }

        // Generar nueva API Key (Esto invalidará la anterior si existía)
        const newApiKey = await AgentAuthService.generateApiKeyForEquipo(equipo_id);

        res.status(201).json({
            success: true,
            message: 'Agente registrado correctamente. Guarda esta API Key en la configuración del Agente Windows.',
            data: {
                equipo_id,
                api_key: newApiKey
            }
        });

    } catch (error) {
        console.error('Error registrando agente:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al registrar agente.' });
    }
};

/**
 * Heartbeat enviado por el Agente Windows
 * POST /api/agentes/heartbeat
 * Requiere Middleware: requireAgentAuth
 */
const heartbeat = async (req, res) => {
    try {
        const equipoId = req.equipoId; // Inyectado por el middleware
        const { version } = req.body;

        await AgentesModel.updateHeartbeat(equipoId, version || '1.0.0');

        res.status(200).json({
            success: true,
            message: 'Heartbeat recibido',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en heartbeat:', error);
        res.status(500).json({ success: false, message: 'Error procesando heartbeat.' });
    }
};

/**
 * Recibe el escaneo profundo de hardware y software (Normalmente 1 vez al día o al iniciar el agente)
 * POST /api/agentes/inventory
 * Requiere Middleware: requireAgentAuth
 */
const inventory = async (req, res) => {
    try {
        const equipoId = req.equipoId;
        const payload = req.body;

        if (!payload) {
            return res.status(400).json({ success: false, message: 'Payload de inventario vacío.' });
        }

        // El servicio de Diff se encarga de auditar si hubo piezas removidas o agregadas
        await InventoryDiffService.processInventory(equipoId, payload);

        res.status(200).json({
            success: true,
            message: 'Inventario procesado correctamente.'
        });
    } catch (error) {
        console.error('Error procesando inventario:', error);
        res.status(500).json({ success: false, message: 'Error interno guardando inventario.' });
    }
};

module.exports = {
    registerAgent,
    heartbeat,
    inventory
};

