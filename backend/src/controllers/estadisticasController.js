const estadisticasService = require('../services/estadisticas.service');

async function obtener(req, res) {
    const data = await estadisticasService.obtener();
    return res.json({ status: 'success', message: 'Estadísticas obtenidas', data });
}

module.exports = { obtener };
