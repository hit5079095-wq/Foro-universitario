const express = require('express');
const authController = require('../controllers/authController');
const verificarToken = require('../middleware/verificarToken');
const validar = require('../middleware/validar');
const esquemas = require('../controllers/esquemas');

const router = express.Router();

router.post('/registro', validar(esquemas.registro), authController.registro);
router.post('/login', validar(esquemas.login), authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, validar(esquemas.editarPerfil), authController.editarPerfil);
router.put('/password', verificarToken, validar(esquemas.cambiarPassword), authController.cambiarPassword);
router.get('/mis-reportes', verificarToken, authController.misReportes);

module.exports = router;
