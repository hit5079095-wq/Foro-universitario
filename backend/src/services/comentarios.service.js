const { obtenerRepositorios } = require('../repositories');
const ErrorHttp = require('../utils/ErrorHttp');
const { obtenerPaginacion } = require('../utils/paginacion');
const { serializarComentario } = require('../utils/serializadores');

const repos = () => obtenerRepositorios();

async function exigirReporte(reporteId) {
    if (!(await repos().reporte.existe(reporteId))) throw new ErrorHttp(404, 'Reporte no encontrado');
}

async function exigirComentario(id) {
    const comentario = await repos().comentario.obtenerAutor(id);
    if (!comentario) throw new ErrorHttp(404, 'Comentario no encontrado');
    return comentario;
}

async function crear(reporteId, contenido, usuario) {
    if (typeof contenido !== 'string' || !contenido.trim() || contenido.trim().length > 500) {
        throw new ErrorHttp(400, 'El comentario debe tener entre 1 y 500 caracteres');
    }
    await exigirReporte(reporteId);

    const comentario = await repos().comentario.crear({ reporteId, usuarioId: usuario.id, contenido: contenido.trim() });
    return serializarComentario(comentario);
}

async function listarPorReporte(reporteId, query) {
    await exigirReporte(reporteId);
    const { pagina, limite, skip, take } = obtenerPaginacion(query);

    const { total, items } = await repos().comentario.listarPorReporte(reporteId, { skip, take });
    return { total, pagina, limite, items: items.map(serializarComentario) };
}

async function editar(id, contenido, usuario) {
    const comentario = await exigirComentario(id);
    if (comentario.usuarioId !== usuario.id) throw new ErrorHttp(403, 'No puedes editar un comentario ajeno');

    return serializarComentario(await repos().comentario.actualizarContenido(id, contenido));
}

async function eliminar(id, usuario) {
    const comentario = await exigirComentario(id);
    if (comentario.usuarioId !== usuario.id && usuario.rol !== 'admin') {
        throw new ErrorHttp(403, 'No puedes eliminar un comentario ajeno');
    }
    await repos().comentario.eliminar(id);
}

module.exports = { crear, listarPorReporte, editar, eliminar };
