const { obtenerStore } = require('../../database/memoria/store');
const { autor, comparar } = require('./comun');

module.exports = {
    async listarPorReporte(reporteId) {
        return obtenerStore().historialEstados
            .filter((h) => h.reporteId === reporteId)
            .sort((a, b) => comparar(new Date(a.creadoEn).getTime(), new Date(b.creadoEn).getTime(), 'desc') || b.id - a.id)
            .map((h) => ({ ...h, usuario: autor(h.usuarioId) }));
    }
};
