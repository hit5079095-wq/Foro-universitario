const { obtenerStore } = require('../../database/memoria/store');
const { comparar, enriquecerReporte } = require('./comun');

module.exports = {
    async obtener() {
        const store = obtenerStore();
        const conteoPorEstado = {};
        for (const reporte of store.reportes) {
            conteoPorEstado[reporte.estado] = (conteoPorEstado[reporte.estado] || 0) + 1;
        }

        return {
            totalReportes: store.reportes.length,
            conteoPorEstado,
            categorias: [...store.categorias].sort((a, b) => a.id - b.id).map((c) => ({
                id: c.id,
                nombre: c.nombre,
                cantidad: store.reportes.filter((r) => r.categoriaId === c.id).length
            })),
            totalUsuarios: store.usuarios.length,
            totalComentarios: store.comentarios.length,
            recientes: [...store.reportes]
                .sort((a, b) => comparar(new Date(a.creadoEn).getTime(), new Date(b.creadoEn).getTime(), 'desc') || b.id - a.id)
                .slice(0, 5)
                .map((r) => enriquecerReporte(r))
        };
    }
};
