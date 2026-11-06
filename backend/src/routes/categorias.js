const express = require('express');
const categoriasController = require('../controllers/categoriasController');
const verificarToken = require('../middlewares/verificarToken');
const soloAdmin = require('../middlewares/soloAdmin');
const validar = require('../middlewares/validar');
const esquemas = require('../validators/esquemas');

const router = express.Router();

router.get('/', categoriasController.listar);
router.post('/', verificarToken, soloAdmin, validar(esquemas.categoria), categoriasController.crear);
router.put('/:id', verificarToken, soloAdmin, validar(esquemas.categoria), categoriasController.editar);
router.delete('/:id', verificarToken, soloAdmin, categoriasController.eliminar);

module.exports = router;
