// Repositorios en memoria con las mismas interfaces que los de Prisma.
module.exports = {
    categoria: require('./categoria.repository'),
    usuario: require('./usuario.repository'),
    reporte: require('./reporte.repository'),
    comentario: require('./comentario.repository'),
    voto: require('./voto.repository'),
    historialEstado: require('./historialEstado.repository'),
    estadisticas: require('./estadisticas.repository')
};
