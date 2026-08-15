const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const { listarNodosDisponibles, vincularEquipo, conectar, autoVincular, vincularConSeleccion } = require('../controllers/soporte.controller');
// Solo Admin (1) o Técnico (2) pueden usar soporte remoto
router.get('/nodos-disponibles', verificarToken, verificarRol(1, 2), listarNodosDisponibles);
router.post('/vincular', verificarToken, verificarRol(1, 2), vincularEquipo);
router.get('/conectar/:serial', verificarToken, verificarRol(1, 2), conectar);
router.post('/auto-vincular', verificarToken, autoVincular);
router.post('/vincular-seleccion', verificarToken, vincularConSeleccion);

module.exports = router;