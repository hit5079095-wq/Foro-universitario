const prisma = require('../lib/prisma');
const { obtenerIdPositivo, obtenerLimite, responderIdInvalido } = require('./validaciones');

async function crear(req, res, next) {
    const reporteId = obtenerIdPositivo(req.params.id);
    if (!reporteId) return responderIdInvalido(res, 'del reporte');

    const { contenido } = req.body || {};
    if (typeof contenido !== 'string' || !contenido.trim() || contenido.trim().length > 500) {
        return res.status(400).json({
            status: 'error',
            message: 'El comentario debe tener entre 1 y 500 caracteres',
            data: null
        });
    }

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id: reporteId },
            select: { id: true }
        });
        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }

        const comentario = await prisma.comentario.create({
            data: {
                reporteId,
                usuarioId: req.usuario.id,
                contenido: contenido.trim()
            },
            include: { usuario: { select: { nombre: true } } }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Comentario creado',
            data: serializarComentario(comentario)
        });
    } catch (error) {
        return next(error);
    }
}

async function listarPorReporte(req, res, next) {
    const reporteId = obtenerIdPositivo(req.params.id);
    if (!reporteId) return responderIdInvalido(res, 'del reporte');

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id: reporteId },
            select: { id: true }
        });
        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado', data: null });
        }

        const pagina = req.query.pagina === undefined ? 1 : obtenerIdPositivo(req.query.pagina);
        const limite = obtenerLimite(req.query.limite);
        if (!pagina || !limite || !Number.isSafeInteger((pagina - 1) * limite)) {
            return res.status(400).json({
                status: 'error',
                message: 'La página y el límite deben ser enteros positivos y estar dentro del rango permitido',
                data: null
            });
        }

        const [total, comentarios] = await prisma.$transaction([
            prisma.comentario.count({ where: { reporteId } }),
            prisma.comentario.findMany({
                where: { reporteId },
                include: { usuario: { select: { nombre: true } } },
                orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
                skip: (pagina - 1) * limite,
                take: limite
            })
        ]);
        return res.json({
            status: 'success',
            message: 'Comentarios obtenidos',
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            data: comentarios.map(serializarComentario)
        });
    } catch (error) {
        return next(error);
    }
}

async function editar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del comentario');

    try {
        const comentario = await prisma.comentario.findUnique({
            where: { id },
            select: { usuarioId: true }
        });

        if (!comentario) {
            return res.status(404).json({ status: 'error', message: 'Comentario no encontrado', data: null });
        }
        if (comentario.usuarioId !== req.usuario.id) {
            return res.status(403).json({ status: 'error', message: 'No puedes editar un comentario ajeno', data: null });
        }

        const actualizado = await prisma.comentario.update({
            where: { id },
            data: { contenido: req.body.contenido },
            include: { usuario: { select: { nombre: true } } }
        });
        return res.json({
            status: 'success',
            message: 'Comentario actualizado',
            data: serializarComentario(actualizado)
        });
    } catch (error) {
        return next(error);
    }
}

async function eliminar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del comentario');

    try {
        const comentario = await prisma.comentario.findUnique({
            where: { id },
            select: { usuarioId: true }
        });

        if (!comentario) {
            return res.status(404).json({ status: 'error', message: 'Comentario no encontrado', data: null });
        }
        if (comentario.usuarioId !== req.usuario.id && req.usuario.rol !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'No puedes eliminar un comentario ajeno', data: null });
        }

        await prisma.comentario.delete({ where: { id } });
        return res.json({ status: 'success', message: 'Comentario eliminado', data: null });
    } catch (error) {
        return next(error);
    }
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

module.exports = { crear, listarPorReporte, editar, eliminar };
