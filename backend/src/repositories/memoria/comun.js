const { obtenerStore } = require('../../database/memoria/store');

const USUARIO_DESCONOCIDO = { nombre: 'Usuario' };

function autor(usuarioId) {
    const usuario = obtenerStore().usuarios.find((u) => u.id === usuarioId);
    return usuario ? { nombre: usuario.nombre } : USUARIO_DESCONOCIDO;
}

function comparar(a, b, direccion) {
    const diff = a < b ? -1 : a > b ? 1 : 0;
    return direccion === 'desc' ? -diff : diff;
}

const incluye = (texto, buscado) => typeof texto === 'string' && texto.toLowerCase().includes(buscado.toLowerCase());

// Devuelve el reporte con la misma forma que el include de Prisma (categoria, usuario, _count, votos?).
function enriquecerReporte(reporte, usuarioActualId) {
    const store = obtenerStore();
    const categoria = store.categorias.find((c) => c.id === reporte.categoriaId);
    const votos = store.votos.filter((v) => v.reporteId === reporte.id);
    return {
        ...reporte,
        categoria: categoria ? { id: categoria.id, nombre: categoria.nombre } : { id: reporte.categoriaId, nombre: 'General' },
        usuario: autor(reporte.usuarioId),
        _count: {
            comentarios: store.comentarios.filter((c) => c.reporteId === reporte.id).length,
            votos: votos.length
        },
        ...(usuarioActualId
            ? { votos: votos.filter((v) => v.usuarioId === usuarioActualId).map((v) => ({ id: v.id })) }
            : {})
    };
}

module.exports = { autor, comparar, incluye, enriquecerReporte };
