const CON_AUTOR = { usuario: { select: { nombre: true } } };

module.exports = (prisma) => ({
    async listarPorReporte(reporteId, { skip = 0, take = 10 } = {}) {
        const [total, items] = await prisma.$transaction([
            prisma.comentario.count({ where: { reporteId } }),
            prisma.comentario.findMany({
                where: { reporteId },
                include: CON_AUTOR,
                orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
                skip,
                take
            })
        ]);
        return { total, items };
    },

    crear({ reporteId, usuarioId, contenido }) {
        return prisma.comentario.create({ data: { reporteId, usuarioId, contenido }, include: CON_AUTOR });
    },

    obtenerAutor(id) {
        return prisma.comentario.findUnique({ where: { id }, select: { usuarioId: true } });
    },

    actualizarContenido(id, contenido) {
        return prisma.comentario.update({ where: { id }, data: { contenido }, include: CON_AUTOR });
    },

    async eliminar(id) {
        await prisma.comentario.delete({ where: { id } });
    }
});
