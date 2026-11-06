const { obtenerRepositorios } = require('../repositories');
const { serializarReporte } = require('../utils/serializadores');
const { ESTADOS_PERMITIDOS } = require('./reportes.service');

async function obtener() {
    const datos = await obtenerRepositorios().estadisticas.obtener();
    return {
        totalReportes: datos.totalReportes,
        porEstado: ESTADOS_PERMITIDOS.map((estado) => ({ estado, cantidad: datos.conteoPorEstado[estado] || 0 })),
        porCategoria: datos.categorias.map(({ id, nombre, cantidad }) => ({ id, nombre, cantidad })),
        totalUsuarios: datos.totalUsuarios,
        totalComentarios: datos.totalComentarios,
        // Sin usuario: serializarReporte no agrega yaVote.
        reportesRecientes: datos.recientes.map(serializarReporte)
    };
}

module.exports = { obtener };
