const { obtenerStore, siguienteId } = require('../../database/memoria/store');
const { errorDuplicado } = require('../errores');

module.exports = {
    async crear({ reporteId, usuarioId }) {
        const store = obtenerStore();
        if (store.votos.some((v) => v.reporteId === reporteId && v.usuarioId === usuarioId)) {
            throw errorDuplicado('El voto ya existe');
        }
        const voto = { id: siguienteId('voto'), reporteId, usuarioId, creadoEn: new Date() };
        store.votos.push(voto);
        return { reporteId, usuarioId, creadoEn: voto.creadoEn };
    },

    async eliminar({ reporteId, usuarioId }) {
        const store = obtenerStore();
        const antes = store.votos.length;
        store.votos = store.votos.filter((v) => !(v.reporteId === reporteId && v.usuarioId === usuarioId));
        return antes - store.votos.length;
    }
};
