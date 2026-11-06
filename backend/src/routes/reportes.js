const express = require('express');
const reportesController = require('../controllers/reportesController');
const verificarToken = require('../middlewares/verificarToken');
const verificarTokenOpcional = require('../middlewares/verificarTokenOpcional');
const validar = require('../middlewares/validar');
const esquemas = require('../validators/esquemas');
const votosController = require('../controllers/votosController');

const router = express.Router();

router.get('/', verificarTokenOpcional, reportesController.listar);
router.get('/:id/historial', reportesController.historial);
router.post('/:id/votos', verificarToken, votosController.crear);
router.delete('/:id/votos', verificarToken, votosController.eliminar);
router.get('/:id', verificarTokenOpcional, reportesController.obtener);
router.post('/', verificarToken, validar(esquemas.reporte), reportesController.crear);
router.put('/:id', verificarToken, validar(esquemas.editarReporte), reportesController.editar);
router.patch('/:id/estado', verificarToken, validar(esquemas.estado), reportesController.actualizarEstado);
router.delete('/:id', verificarToken, reportesController.eliminar);

module.exports = router;
