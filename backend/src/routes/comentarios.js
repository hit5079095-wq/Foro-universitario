const express = require('express');
const comentariosController = require('../controllers/comentariosController');
const verificarToken = require('../middlewares/verificarToken');
const validar = require('../middlewares/validar');
const esquemas = require('../validators/esquemas');

const router = express.Router();

router.post('/reportes/:id/comentarios', verificarToken, validar(esquemas.comentario), comentariosController.crear);
router.get('/reportes/:id/comentarios', comentariosController.listarPorReporte);
router.put('/comentarios/:id', verificarToken, validar(esquemas.comentario), comentariosController.editar);
router.delete('/comentarios/:id', verificarToken, comentariosController.eliminar);

module.exports = router;
