const comentariosService = require('../services/comentarios.service');
const { exigirId, respuestaPaginada } = require('../utils/paginacion');

async function crear(req, res) {
    const reporteId = exigirId(req.params.id, 'del reporte');
    const comentario = await comentariosService.crear(reporteId, (req.body || {}).contenido, req.usuario);
    return res.status(201).json({ status: 'success', message: 'Comentario creado', data: comentario });
}

async function listarPorReporte(req, res) {
    const reporteId = exigirId(req.params.id, 'del reporte');
    const resultado = await comentariosService.listarPorReporte(reporteId, req.query);
    return res.json(respuestaPaginada('Comentarios obtenidos', resultado, resultado.items));
}

async function editar(req, res) {
    const id = exigirId(req.params.id, 'del comentario');
    const comentario = await comentariosService.editar(id, req.body.contenido, req.usuario);
    return res.json({ status: 'success', message: 'Comentario actualizado', data: comentario });
}

async function eliminar(req, res) {
    const id = exigirId(req.params.id, 'del comentario');
    await comentariosService.eliminar(id, req.usuario);
    return res.json({ status: 'success', message: 'Comentario eliminado', data: null });
}

module.exports = { crear, listarPorReporte, editar, eliminar };
