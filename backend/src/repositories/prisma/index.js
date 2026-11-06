// Repositorios respaldados por Prisma; cada fábrica recibe el PrismaClient.
module.exports = (prisma) => ({
    categoria: require('./categoria.repository')(prisma),
    usuario: require('./usuario.repository')(prisma),
    reporte: require('./reporte.repository')(prisma),
    comentario: require('./comentario.repository')(prisma),
    voto: require('./voto.repository')(prisma),
    historialEstado: require('./historialEstado.repository')(prisma),
    estadisticas: require('./estadisticas.repository')(prisma)
});
