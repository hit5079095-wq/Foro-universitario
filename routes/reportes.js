const express = require('express');
const reportesController = require('../controllers/reportesController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

router.get('/', reportesController.listar);
router.get('/:id', reportesController.obtener);
router.post('/', verificarToken, reportesController.crear);
router.put('/:id', verificarToken, reportesController.editar);
router.patch('/:id/estado', verificarToken, reportesController.actualizarEstado);
router.delete('/:id', verificarToken, reportesController.eliminar);

module.exports = router;
