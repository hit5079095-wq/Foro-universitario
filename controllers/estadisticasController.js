const prisma = require('../lib/prisma');
const ESTADOS = ['pendiente', 'en_proceso', 'resuelto'];

async function obtener(req, res, next) {
    try {
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

        return res.json({
            status: 'success',
            message: 'Estadísticas obtenidas',
            data: {
                totalReportes,
                porEstado: ESTADOS.map((estado) => ({
                    estado,
                    cantidad: porEstado.find((item) => item.estado === estado)?._count._all || 0
                })),
                porCategoria: categorias.map((categoria) => ({
                    id: categoria.id,
                    nombre: categoria.nombre,
                    cantidad: categoria._count.reportes
                })),
                totalUsuarios,
                totalComentarios,
                reportesRecientes: recientes.map((reporte) => ({
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
                    totalVotos: reporte._count.votos
                }))
            }
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = { obtener };
