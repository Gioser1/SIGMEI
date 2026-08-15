const express = require('express');
const router = express.Router({ mergeParams: true });
const { verificarToken } = require('../middlewares/auth.middleware');
const {
    getMensajesByIncidencia,
    crearMensaje
} = require('../controllers/mensajes.controller');

router.get('/:incidencia_id/mensajes', verificarToken, getMensajesByIncidencia);
router.post('/:incidencia_id/mensajes', verificarToken, crearMensaje);

module.exports = router;
