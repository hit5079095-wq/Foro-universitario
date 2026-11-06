const express = require('express');
const usuariosController = require('../controllers/usuariosController');
const verificarToken = require('../middlewares/verificarToken');
const verificarTokenOpcional = require('../middlewares/verificarTokenOpcional');
const soloAdmin = require('../middlewares/soloAdmin');
const validar = require('../middlewares/validar');
const esquemas = require('../validators/esquemas');

const router = express.Router();

router.get('/', verificarToken, soloAdmin, usuariosController.listar);
router.patch('/:id/rol', verificarToken, soloAdmin, validar(esquemas.rol), usuariosController.cambiarRol);
router.get('/:id/reportes', verificarTokenOpcional, usuariosController.listarReportes);

module.exports = router;
