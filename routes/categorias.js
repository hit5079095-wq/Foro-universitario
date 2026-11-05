const express = require('express');
const categoriasController = require('../controllers/categoriasController');
const verificarToken = require('../middleware/verificarToken');
const soloAdmin = require('../middleware/soloAdmin');
const validar = require('../middleware/validar');
const esquemas = require('../controllers/esquemas');

const router = express.Router();

router.get('/', categoriasController.listar);
router.post('/', verificarToken, soloAdmin, validar(esquemas.categoria), categoriasController.crear);
router.put('/:id', verificarToken, soloAdmin, validar(esquemas.categoria), categoriasController.editar);
router.delete('/:id', verificarToken, soloAdmin, categoriasController.eliminar);

module.exports = router;
