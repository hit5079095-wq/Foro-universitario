module.exports = (prisma) => ({
    // Lanza P2002 si el usuario ya votó por el reporte.
    crear({ reporteId, usuarioId }) {
        return prisma.voto.create({
            data: { reporteId, usuarioId },
            select: { reporteId: true, usuarioId: true, creadoEn: true }
        });
    },

    async eliminar({ reporteId, usuarioId }) {
        const { count } = await prisma.voto.deleteMany({ where: { reporteId, usuarioId } });
        return count;
    }
});
