const categoriasService = require('../services/categorias.service');
const { exigirId } = require('../utils/paginacion');

async function listar(req, res) {
    const categorias = await categoriasService.listar();
    return res.json({ status: 'success', message: 'Categorías obtenidas', total: categorias.length, data: categorias });
}

async function crear(req, res) {
    const categoria = await categoriasService.crear(req.body);
    return res.status(201).json({ status: 'success', message: 'Categoría creada', data: categoria });
}

async function editar(req, res) {
    const id = exigirId(req.params.id, 'de categoría');
    const categoria = await categoriasService.editar(id, req.body);
    return res.json({ status: 'success', message: 'Categoría actualizada', data: categoria });
}

async function eliminar(req, res) {
    const id = exigirId(req.params.id, 'de categoría');
    await categoriasService.eliminar(id);
    return res.json({ status: 'success', message: 'Categoría eliminada', data: null });
}

module.exports = { listar, crear, editar, eliminar };
