const votosService = require('../services/votos.service');
const { exigirId } = require('../utils/paginacion');

async function crear(req, res) {
    const reporteId = exigirId(req.params.id, 'del reporte');
    const voto = await votosService.votar(reporteId, req.usuario.id);
    return res.status(201).json({ status: 'success', message: 'Voto registrado', data: voto });
}

async function eliminar(req, res) {
    const reporteId = exigirId(req.params.id, 'del reporte');
    await votosService.quitarVoto(reporteId, req.usuario.id);
    return res.json({ status: 'success', message: 'Voto eliminado', data: null });
}

module.exports = { crear, eliminar };
