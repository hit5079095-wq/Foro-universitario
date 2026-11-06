const express = require('express');

// Monta todas las rutas de la API; app.js lo usa bajo /api.
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/categorias', require('./categorias'));
router.use('/reportes', require('./reportes'));
router.use('/usuarios', require('./usuarios'));
router.use('/estadisticas', require('./estadisticas'));
router.use('/', require('./comentarios'));

module.exports = router;
