const express = require('express');
const usuariosController = require('../controllers/usuariosController');
const verificarToken = require('../middleware/verificarToken');
const verificarTokenOpcional = require('../middleware/verificarTokenOpcional');
const soloAdmin = require('../middleware/soloAdmin');
const validar = require('../middleware/validar');
const esquemas = require('../controllers/esquemas');

const router = express.Router();

router.get('/', verificarToken, soloAdmin, usuariosController.listar);
router.patch('/:id/rol', verificarToken, soloAdmin, validar(esquemas.rol), usuariosController.cambiarRol);
router.get('/:id/reportes', verificarTokenOpcional, usuariosController.listarReportes);

module.exports = router;
