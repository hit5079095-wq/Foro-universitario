const { obtenerStore, siguienteId } = require('../../database/memoria/store');
const { autor, comparar } = require('./comun');
const { errorNoEncontrado } = require('../errores');

const conAutor = (c) => ({ ...c, usuario: autor(c.usuarioId) });
const porId = (id) => obtenerStore().comentarios.find((c) => c.id === id);

module.exports = {
    async listarPorReporte(reporteId, { skip = 0, take = 10 } = {}) {
        const items = obtenerStore().comentarios
            .filter((c) => c.reporteId === reporteId)
            .sort((a, b) => comparar(new Date(a.creadoEn).getTime(), new Date(b.creadoEn).getTime(), 'asc') || a.id - b.id);
        return { total: items.length, items: items.slice(skip, skip + take).map(conAutor) };
    },

    async crear({ reporteId, usuarioId, contenido }) {
        const comentario = { id: siguienteId('comentario'), reporteId, usuarioId, contenido, creadoEn: new Date() };
        obtenerStore().comentarios.push(comentario);
        return conAutor(comentario);
    },

    async obtenerAutor(id) {
        const comentario = porId(id);
        return comentario ? { usuarioId: comentario.usuarioId } : null;
    },

    async actualizarContenido(id, contenido) {
        const comentario = porId(id);
        if (!comentario) throw errorNoEncontrado('Comentario no encontrado');
        comentario.contenido = contenido;
        return conAutor(comentario);
    },

    async eliminar(id) {
        const store = obtenerStore();
        if (!porId(id)) throw errorNoEncontrado('Comentario no encontrado');
        store.comentarios = store.comentarios.filter((c) => c.id !== id);
    }
};
