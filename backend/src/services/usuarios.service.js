const { obtenerRepositorios } = require('../repositories');
const ErrorHttp = require('../utils/ErrorHttp');
const reportesService = require('./reportes.service');

const repos = () => obtenerRepositorios();
const noEncontrado = () => new ErrorHttp(404, 'Usuario no encontrado');

function listar() {
    return repos().usuario.listar();
}

async function listarReportes(usuarioId, query, usuarioActualId) {
    if (!(await repos().usuario.existe(usuarioId))) throw noEncontrado();
    return reportesService.listar(query, { usuarioActualId, usuarioIdForzado: usuarioId });
}

async function cambiarRol(usuarioId, rol, usuarioActual) {
    if (usuarioId === usuarioActual.id && rol !== 'admin') {
        throw new ErrorHttp(403, 'No puedes quitarte tu propio rol de administrador');
    }
    if (!(await repos().usuario.existe(usuarioId))) throw noEncontrado();
    return repos().usuario.actualizarRol(usuarioId, rol);
}

module.exports = { listar, listarReportes, cambiarRol };
