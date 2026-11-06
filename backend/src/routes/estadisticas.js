const express = require('express');
const estadisticasController = require('../controllers/estadisticasController');

const router = express.Router();

router.get('/', estadisticasController.obtener);

module.exports = router;
