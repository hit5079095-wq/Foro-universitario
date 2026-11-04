const express = require('express');
const comentariosController = require('../controllers/comentariosController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

router.post('/reportes/:id/comentarios', verificarToken, comentariosController.crear);
router.get('/reportes/:id/comentarios', comentariosController.listarPorReporte);
router.delete('/comentarios/:id', verificarToken, comentariosController.eliminar);

module.exports = router;
