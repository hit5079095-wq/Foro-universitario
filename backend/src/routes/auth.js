const express = require('express');
const authController = require('../controllers/authController');
const verificarToken = require('../middlewares/verificarToken');
const validar = require('../middlewares/validar');
const esquemas = require('../validators/esquemas');

const router = express.Router();

router.post('/registro', validar(esquemas.registro), authController.registro);
router.post('/login', validar(esquemas.login), authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, validar(esquemas.editarPerfil), authController.editarPerfil);
router.put('/password', verificarToken, validar(esquemas.cambiarPassword), authController.cambiarPassword);
router.get('/mis-reportes', verificarToken, authController.misReportes);

module.exports = router;
