const { esAutorOAdmin } = require('../../utils/permisos');

const ORDENES = {
    recientes: [{ creadoEn: 'desc' }, { id: 'desc' }],
    antiguos: [{ creadoEn: 'asc' }, { id: 'asc' }],
    mas_comentados: [{ comentarios: { _count: 'desc' } }, { creadoEn: 'desc' }, { id: 'desc' }],
    mas_apoyados: [{ votos: { _count: 'desc' } }, { creadoEn: 'desc' }, { id: 'desc' }]
};

// Relaciones que necesita serializarReporte; "votos" solo cuando hay usuario (para yaVote).
function relaciones(usuarioActualId) {
    return {
        categoria: { select: { id: true, nombre: true } },
        usuario: { select: { nombre: true } },
        _count: { select: { comentarios: true, votos: true } },
        ...(usuarioActualId ? { votos: { where: { usuarioId: usuarioActualId }, select: { id: true } } } : {})
    };
}

function construirWhere({ categoriaId, usuarioId, estado, ubicacion, q } = {}) {
    return {
        ...(categoriaId === undefined ? {} : { categoriaId }),
        ...(usuarioId === undefined ? {} : { usuarioId }),
        ...(estado === undefined ? {} : { estado }),
        ...(ubicacion ? { ubicacion: { contains: ubicacion, mode: 'insensitive' } } : {}),
        ...(q ? {
            OR: [
                { titulo: { contains: q, mode: 'insensitive' } },
                { descripcion: { contains: q, mode: 'insensitive' } }
            ]
        } : {})
    };
}

module.exports = (prisma) => ({
    async listar({ filtros = {}, orden = 'recientes', skip = 0, take = 10, usuarioActualId } = {}) {
        const where = construirWhere(filtros);
        const [total, items] = await prisma.$transaction([
            prisma.reporte.count({ where }),
            prisma.reporte.findMany({
                where,
                include: relaciones(usuarioActualId),
                orderBy: ORDENES[orden] || ORDENES.recientes,
                skip,
                take
            })
        ]);
        return { total, items };
    },

    buscarPorId(id, { usuarioActualId, conComentarios = false } = {}) {
        return prisma.reporte.findUnique({
            where: { id },
            include: {
                ...relaciones(usuarioActualId),
                ...(conComentarios ? {
                    comentarios: {
                        orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
                        include: { usuario: { select: { nombre: true } } }
                    }
                } : {})
            }
        });
    },

    async existe(id) {
        return Boolean(await prisma.reporte.findUnique({ where: { id }, select: { id: true } }));
    },

    obtenerAutor(id) {
        return prisma.reporte.findUnique({ where: { id }, select: { usuarioId: true } });
    },

    crear(datos, usuarioActualId) {
        return prisma.reporte.create({ data: datos, include: relaciones(usuarioActualId) });
    },

    actualizar(id, datos, usuarioActualId) {
        return prisma.reporte.update({ where: { id }, data: datos, include: relaciones(usuarioActualId) });
    },

    // Verifica autor/admin, cambia el estado y registra el historial en una sola transacción.
    actualizarEstadoConHistorial({ id, estado, usuarioId, rol }) {
        return prisma.$transaction(async (tx) => {
            const existente = await tx.reporte.findUnique({ where: { id }, select: { usuarioId: true, estado: true } });
            if (!existente) return { tipo: 'no-encontrado' };
            if (!esAutorOAdmin(existente.usuarioId, { id: usuarioId, rol })) return { tipo: 'prohibido' };

            const reporte = await tx.reporte.update({
                where: { id },
                data: { estado },
                include: relaciones(usuarioId)
            });
            if (existente.estado !== estado) {
                await tx.historialEstado.create({
                    data: { reporteId: id, usuarioId, estadoAnterior: existente.estado, estadoNuevo: estado }
                });
            }
            return { tipo: 'actualizado', reporte };
        });
    },

    // Verifica autor/admin y elimina el reporte con sus comentarios (votos e historial caen en cascada).
    eliminarConComentarios({ id, usuarioId, rol }) {
        return prisma.$transaction(async (tx) => {
            const reporte = await tx.reporte.findUnique({ where: { id }, select: { usuarioId: true } });
            if (!reporte) return { tipo: 'no-encontrado' };
            if (!esAutorOAdmin(reporte.usuarioId, { id: usuarioId, rol })) return { tipo: 'prohibido' };

            await tx.comentario.deleteMany({ where: { reporteId: id } });
            await tx.reporte.delete({ where: { id } });
            return { tipo: 'eliminado' };
        });
    }
});

module.exports.ORDENES = ORDENES;
