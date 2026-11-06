const { obtenerRepositorios } = require('../repositories');
const { esDuplicado } = require('../repositories/errores');
const ErrorHttp = require('../utils/ErrorHttp');

const repos = () => obtenerRepositorios();

async function exigirReporte(reporteId) {
    if (!(await repos().reporte.existe(reporteId))) throw new ErrorHttp(404, 'Reporte no encontrado');
}

async function votar(reporteId, usuarioId) {
    await exigirReporte(reporteId);
    try {
        return await repos().voto.crear({ reporteId, usuarioId });
    } catch (error) {
        if (esDuplicado(error)) throw new ErrorHttp(409, 'Ya votaste por este reporte');
        throw error;
    }
}

async function quitarVoto(reporteId, usuarioId) {
    await exigirReporte(reporteId);
    await repos().voto.eliminar({ reporteId, usuarioId });
}

module.exports = { votar, quitarVoto };
