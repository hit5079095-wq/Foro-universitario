module.exports = (prisma) => ({
    // Del cambio más reciente al más antiguo.
    listarPorReporte(reporteId) {
        return prisma.historialEstado.findMany({
            where: { reporteId },
            include: { usuario: { select: { nombre: true } } },
            orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
        });
    }
});
