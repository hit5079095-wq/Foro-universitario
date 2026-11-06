module.exports = (prisma) => ({
    async obtener() {
        const [totalReportes, porEstado, categorias, totalUsuarios, totalComentarios, recientes] =
            await prisma.$transaction([
                prisma.reporte.count(),
                prisma.reporte.groupBy({ by: ['estado'], _count: { _all: true } }),
                prisma.categoria.findMany({
                    select: { id: true, nombre: true, _count: { select: { reportes: true } } },
                    orderBy: { id: 'asc' }
                }),
                prisma.usuario.count(),
                prisma.comentario.count(),
                prisma.reporte.findMany({
                    take: 5,
                    include: {
                        categoria: { select: { id: true, nombre: true } },
                        usuario: { select: { nombre: true } },
                        _count: { select: { comentarios: true, votos: true } }
                    },
                    orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
                })
            ]);

        return {
            totalReportes,
            conteoPorEstado: Object.fromEntries(porEstado.map((item) => [item.estado, item._count._all])),
            categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre, cantidad: c._count.reportes })),
            totalUsuarios,
            totalComentarios,
            recientes
        };
    }
});
