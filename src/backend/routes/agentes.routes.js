const express = require('express');
const router = express.Router();
const agentesController = require('../controllers/agentes.controller');
const { requireAgentAuth } = require('../middlewares/agentAuth');
// Si usas un middleware para JWT de Admin en la ruta de registro, importalo aquí
// const authMiddleware = require('../middlewares/auth');

// Registrar un agente (Idealmente protegido por Admin auth, ej. authMiddleware)
// POST /api/agentes/register
router.post('/register', agentesController.registerAgent);

// Heartbeat del agente (Protegido por API Key del Agente)
// POST /api/agentes/heartbeat
router.post('/heartbeat', requireAgentAuth, agentesController.heartbeat);

// Inventario completo (Hardware y Software)
// POST /api/agentes/inventory
router.post('/inventory', requireAgentAuth, agentesController.inventory);

module.exports = router;

