const usuariosService = require('../services/usuarios.service');
const { exigirId, respuestaPaginada } = require('../utils/paginacion');

async function listar(req, res) {
    const usuarios = await usuariosService.listar();
    return res.json({ status: 'success', message: 'Usuarios obtenidos', data: usuarios });
}

async function listarReportes(req, res) {
    const id = exigirId(req.params.id, 'del usuario');
    const resultado = await usuariosService.listarReportes(id, req.query, req.usuario?.id);
    return res.json(respuestaPaginada('Reportes obtenidos', resultado, resultado.items));
}

async function cambiarRol(req, res) {
    const id = exigirId(req.params.id, 'del usuario');
    const usuario = await usuariosService.cambiarRol(id, req.body.rol, req.usuario);
    return res.json({ status: 'success', message: 'Rol de usuario actualizado', data: usuario });
}

module.exports = { listar, listarReportes, cambiarRol };
