const reportesService = require('../services/reportes.service');
const { exigirId, respuestaPaginada } = require('../utils/paginacion');

async function listar(req, res) {
    const resultado = await reportesService.listar(req.query, { usuarioActualId: req.usuario?.id });
    return res.json(respuestaPaginada('Reportes obtenidos', resultado, resultado.items));
}

async function obtener(req, res) {
    const id = exigirId(req.params.id, 'del reporte');
    const reporte = await reportesService.obtener(id, req.usuario?.id);
    return res.json({ status: 'success', message: 'Reporte obtenido', data: reporte });
}

async function crear(req, res) {
    const reporte = await reportesService.crear(req.body || {}, req.usuario);
    return res.status(201).json({ status: 'success', message: 'Reporte creado', data: reporte });
}

async function editar(req, res) {
    const id = exigirId(req.params.id, 'del reporte');
    const reporte = await reportesService.editar(id, req.body || {}, req.usuario);
    return res.json({ status: 'success', message: 'Reporte actualizado', data: reporte });
}

async function actualizarEstado(req, res) {
    const id = exigirId(req.params.id, 'del reporte');
    const reporte = await reportesService.actualizarEstado(id, (req.body || {}).estado, req.usuario);
    return res.json({ status: 'success', message: 'Estado actualizado', data: reporte });
}

async function eliminar(req, res) {
    const id = exigirId(req.params.id, 'del reporte');
    await reportesService.eliminar(id, req.usuario);
    return res.json({ status: 'success', message: 'Reporte eliminado', data: null });
}

async function historial(req, res) {
    const id = exigirId(req.params.id, 'del reporte');
    const data = await reportesService.historial(id);
    return res.json({ status: 'success', message: 'Historial de estados obtenido', data });
}

module.exports = { listar, obtener, crear, editar, actualizarEstado, eliminar, historial };
