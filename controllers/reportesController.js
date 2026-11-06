const prisma = require('../lib/prisma');
const { obtenerIdPositivo, obtenerLimite, responderIdInvalido } = require('./validaciones');

const ESTADOS_PERMITIDOS = ['pendiente', 'en_proceso', 'resuelto'];
const ORDENAMIENTOS = ['recientes', 'antiguos', 'mas_comentados', 'mas_apoyados'];

function relacionesReporte(usuarioId) {
    return {
        categoria: { select: { id: true, nombre: true } },
        usuario: { select: { nombre: true } },
        _count: { select: { comentarios: true, votos: true } },
        ...(usuarioId ? { votos: { where: { usuarioId }, select: { id: true } } } : {})
    };
}

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

    if (Array.isArray(reporte.votos)) {
        serializado.yaVote = reporte.votos.length > 0;
    }

    return serializado;
}

async function listar(req, res, next) {
    return listarConFiltro(req, res, next, {});
}

async function listarPorUsuario(req, res, next, idUsuario) {
    const usuarioId = idUsuario || obtenerIdPositivo(req.params.id);
    if (!usuarioId) return responderIdInvalido(res, 'del usuario');
    return listarConFiltro(req, res, next, { usuarioId });
}

async function listarConFiltro(req, res, next, filtroExtra) {
    const pagina = req.query.pagina === undefined ? 1 : obtenerIdPositivo(req.query.pagina);
    const limite = obtenerLimite(req.query.limite);
    const categoriaId = req.query.categoriaId === undefined
        ? undefined
        : obtenerIdPositivo(req.query.categoriaId);
    const usuarioId = req.query.usuarioId === undefined
        ? undefined
        : obtenerIdPositivo(req.query.usuarioId);
    const ubicacion = req.query.ubicacion;
    const q = req.query.q;
    const orden = req.query.orden === undefined ? 'recientes' : req.query.orden;

    if (!pagina || !limite || !Number.isSafeInteger((pagina - 1) * limite)) {
        return res.status(400).json({
            status: 'error',
            message: 'La página y el límite deben ser enteros positivos y estar dentro del rango permitido',
            data: null
        });
    }

    if (req.query.categoriaId !== undefined && !categoriaId) {
        return res.status(400).json({ status: 'error', message: 'El identificador de categoría no es válido', data: null });
    }
    if (req.query.usuarioId !== undefined && !usuarioId) {
        return res.status(400).json({ status: 'error', message: 'El identificador de usuario no es válido', data: null });
    }
    if (q !== undefined && typeof q !== 'string') {
        return res.status(400).json({ status: 'error', message: 'El parámetro q debe ser texto', data: null });
    }
    if (ubicacion !== undefined && typeof ubicacion !== 'string') {
        return res.status(400).json({ status: 'error', message: 'El parámetro ubicacion debe ser texto', data: null });
    }
    if (!ORDENAMIENTOS.includes(orden)) {
        return res.status(400).json({
            status: 'error',
            message: `El orden debe ser uno de: ${ORDENAMIENTOS.join(', ')}`,
            data: null
        });
    }

    if (req.query.estado !== undefined && !ESTADOS_PERMITIDOS.includes(req.query.estado)) {
        return res.status(400).json({
            status: 'error',
            message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`,
            data: null
        });
    }

    const where = {
        ...(categoriaId === undefined ? {} : { categoriaId }),
        ...(usuarioId === undefined ? {} : { usuarioId }),
        ...(req.query.estado === undefined ? {} : { estado: req.query.estado }),
        ...(ubicacion === undefined || !ubicacion.trim() ? {} : {
            ubicacion: { contains: ubicacion.trim(), mode: 'insensitive' }
        }),
        ...(q === undefined || !q.trim() ? {} : {
            OR: [
                { titulo: { contains: q.trim(), mode: 'insensitive' } },
                { descripcion: { contains: q.trim(), mode: 'insensitive' } }
            ]
        }),
        ...filtroExtra
    };
    const orderBy = orden === 'antiguos'
        ? [{ creadoEn: 'asc' }, { id: 'asc' }]
        : orden === 'mas_comentados'
            ? [{ comentarios: { _count: 'desc' } }, { creadoEn: 'desc' }, { id: 'desc' }]
            : orden === 'mas_apoyados'
                ? [{ votos: { _count: 'desc' } }, { creadoEn: 'desc' }, { id: 'desc' }]
                : [{ creadoEn: 'desc' }, { id: 'desc' }];

    try {
        const [total, reportes] = await prisma.$transaction([
            prisma.reporte.count({ where }),
            prisma.reporte.findMany({
                where,
                include: relacionesReporte(req.usuario?.id),
                orderBy,
                skip: (pagina - 1) * limite,
                take: limite
            })
        ]);

        return res.json({
            status: 'success',
            message: 'Reportes obtenidos',
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            data: reportes.map(serializarReporte)
        });
    } catch (error) {
        return next(error);
    }
}

async function obtener(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del reporte');

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id },
            include: {
                ...relacionesReporte(req.usuario?.id),
                comentarios: {
                    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
                    include: { usuario: { select: { nombre: true } } }
                }
            }
        });

        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }

        return res.json({
            status: 'success',
            message: 'Reporte obtenido',
            data: {
                ...serializarReporte(reporte),
                comentarios: reporte.comentarios.map((comentario) => ({
                    id: comentario.id,
                    reporteId: comentario.reporteId,
                    usuarioId: comentario.usuarioId,
                    autor: comentario.usuario.nombre,
                    contenido: comentario.contenido,
                    creadoEn: comentario.creadoEn
                }))
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function crear(req, res, next) {
    const { titulo, descripcion, categoriaId } = req.body || {};
    const idCategoria = Number.isSafeInteger(categoriaId) ? categoriaId : null;

    if (typeof titulo !== 'string' || titulo.trim().length < 5 || titulo.trim().length > 120 ||
        typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 1000 ||
        !idCategoria || idCategoria < 1) {
        return res.status(400).json({
            status: 'error',
            message: 'Título (5 a 120 caracteres), descripción (10 a 1000 caracteres) y una categoría válida son obligatorios',
            data: null
        });
    }

    try {
        const categoria = await prisma.categoria.findUnique({
            where: { id: idCategoria },
            select: { id: true }
        });

        if (!categoria) {
            return res.status(400).json({ status: 'error', message: 'La categoría indicada no existe', data: null });
        }

        const reporte = await prisma.reporte.create({
            data: {
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                categoriaId: idCategoria,
                usuarioId: req.usuario.id,
                ubicacion: req.body.ubicacion,
                imagenUrl: req.body.imagenUrl
            },
            include: relacionesReporte(req.usuario.id)
        });

        return res.status(201).json({
            status: 'success',
            message: 'Reporte creado',
            data: serializarReporte(reporte)
        });
    } catch (error) {
        return next(error);
    }
}

async function editar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del reporte');

    const { titulo, descripcion } = req.body || {};
    if (typeof titulo !== 'string' || titulo.trim().length < 5 || titulo.trim().length > 120 ||
        typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 1000) {
        return res.status(400).json({
            status: 'error',
            message: 'Título (5 a 120 caracteres) y descripción (10 a 1000 caracteres) son obligatorios',
            data: null
        });
    }

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id },
            select: { usuarioId: true }
        });

        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }
        if (reporte.usuarioId !== req.usuario.id) {
            return res.status(403).json({ status: 'error', message: 'No puedes editar un reporte ajeno', data: null });
        }

        const actualizado = await prisma.reporte.update({
            where: { id },
            data: {
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                ...(Object.hasOwn(req.body, 'ubicacion') ? { ubicacion: req.body.ubicacion } : {}),
                ...(Object.hasOwn(req.body, 'imagenUrl') ? { imagenUrl: req.body.imagenUrl } : {})
            },
            include: relacionesReporte(req.usuario.id)
        });

        return res.json({ status: 'success', message: 'Reporte actualizado', data: serializarReporte(actualizado) });
    } catch (error) {
        return next(error);
    }
}

async function actualizarEstado(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del reporte');

    const { estado } = req.body || {};
    if (!ESTADOS_PERMITIDOS.includes(estado)) {
        return res.status(400).json({
            status: 'error',
            message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`,
            data: null
        });
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            const reporteExistente = await tx.reporte.findUnique({
                where: { id },
                select: { usuarioId: true, estado: true }
            });
            if (!reporteExistente) return { tipo: 'no-encontrado' };
            if (reporteExistente.usuarioId !== req.usuario.id && req.usuario.rol !== 'admin') {
                return { tipo: 'prohibido' };
            }

            const actualizado = await tx.reporte.update({
                where: { id },
                data: { estado },
                include: relacionesReporte(req.usuario.id)
            });
            if (reporteExistente.estado !== estado) {
                await tx.historialEstado.create({
                    data: {
                        reporteId: id,
                        usuarioId: req.usuario.id,
                        estadoAnterior: reporteExistente.estado,
                        estadoNuevo: estado
                    }
                });
            }

            return { tipo: 'actualizado', reporte: actualizado };
        });

        if (resultado.tipo === 'no-encontrado') {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }
        if (resultado.tipo === 'prohibido') {
            return res.status(403).json({
                status: 'error',
                message: 'No puedes cambiar el estado de un reporte ajeno',
                data: null
            });
        }

        return res.json({
            status: 'success',
            message: 'Estado actualizado',
            data: serializarReporte(resultado.reporte)
        });
    } catch (error) {
        return next(error);
    }
}

async function eliminar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del reporte');

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            const reporte = await tx.reporte.findUnique({
                where: { id },
                select: { usuarioId: true }
            });

            if (!reporte) return { tipo: 'no-encontrado' };
            if (reporte.usuarioId !== req.usuario.id && req.usuario.rol !== 'admin') return { tipo: 'prohibido' };

            await tx.comentario.deleteMany({ where: { reporteId: id } });
            await tx.reporte.delete({ where: { id } });
            return { tipo: 'eliminado' };
        });

        if (resultado.tipo === 'no-encontrado') {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }
        if (resultado.tipo === 'prohibido') {
            return res.status(403).json({ status: 'error', message: 'No puedes eliminar un reporte ajeno', data: null });
        }

        return res.json({ status: 'success', message: 'Reporte eliminado', data: null });
    } catch (error) {
        return next(error);
    }
}

async function historial(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del reporte');

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id },
            select: { id: true }
        });
        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }

        const historialEstados = await prisma.historialEstado.findMany({
            where: { reporteId: id },
            include: { usuario: { select: { nombre: true } } },
            orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
        });

        return res.json({
            status: 'success',
            message: 'Historial de estados obtenido',
            data: historialEstados.map((cambio) => ({
                id: cambio.id,
                reporteId: cambio.reporteId,
                usuarioId: cambio.usuarioId,
                usuario: cambio.usuario.nombre,
                estadoAnterior: cambio.estadoAnterior,
                estadoNuevo: cambio.estadoNuevo,
                creadoEn: cambio.creadoEn
            }))
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = { listar, listarPorUsuario, obtener, crear, editar, actualizarEstado, eliminar, historial };
