// Convierte los datos devueltos por los repositorios en la forma JSON pública de la API.

function serializarReporte(reporte) {
    const serializado = {
        id: reporte.id,
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        categoriaId: reporte.categoriaId,
        ubicacion: reporte.ubicacion,
        imagenUrl: reporte.imagenUrl,
        categoria: reporte.categoria,
        usuarioId: reporte.usuarioId,
        autor: reporte.usuario.nombre,
        estado: reporte.estado,
        creadoEn: reporte.creadoEn,
        actualizadoEn: reporte.actualizadoEn,
        totalComentarios: reporte._count.comentarios,
        totalVotos: reporte._count.votos ?? 0
    };

    // Solo existe "votos" cuando hay un usuario autenticado.
    if (Array.isArray(reporte.votos)) {
        serializado.yaVote = reporte.votos.length > 0;
    }

    return serializado;
}

function serializarComentario(comentario) {
    return {
        id: comentario.id,
        reporteId: comentario.reporteId,
        usuarioId: comentario.usuarioId,
        autor: comentario.usuario.nombre,
        contenido: comentario.contenido,
        creadoEn: comentario.creadoEn
    };
}

function serializarHistorial(cambio) {
    return {
        id: cambio.id,
        reporteId: cambio.reporteId,
        usuarioId: cambio.usuarioId,
        usuario: cambio.usuario.nombre,
        estadoAnterior: cambio.estadoAnterior,
        estadoNuevo: cambio.estadoNuevo,
        creadoEn: cambio.creadoEn
    };
}

module.exports = { serializarReporte, serializarComentario, serializarHistorial };
