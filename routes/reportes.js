const express = require('express');
const reportesController = require('../controllers/reportesController');
const verificarToken = require('../middleware/verificarToken');
const soloAdmin = require('../middleware/soloAdmin');
const validar = require('../middleware/validar');
const esquemas = require('../controllers/esquemas');

const router = express.Router();

router.get('/', reportesController.listar);
router.get('/:id', reportesController.obtener);
router.post('/', verificarToken, validar(esquemas.reporte), reportesController.crear);
router.put('/:id', verificarToken, validar(esquemas.editarReporte), reportesController.editar);
router.patch('/:id/estado', verificarToken, soloAdmin, validar(esquemas.estado), reportesController.actualizarEstado);
router.delete('/:id', verificarToken, reportesController.eliminar);

module.exports = router;
