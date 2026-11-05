const express = require('express');
const usuariosController = require('../controllers/usuariosController');
const verificarToken = require('../middleware/verificarToken');
const soloAdmin = require('../middleware/soloAdmin');

const router = express.Router();

router.get('/', verificarToken, soloAdmin, usuariosController.listar);
router.get('/:id/reportes', usuariosController.listarReportes);

module.exports = router;
