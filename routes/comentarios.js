const express = require('express');
const verificarToken = require('../middleware/verificarToken');

module.exports = (prisma) => {
    const router = express.Router();

    router.use(verificarToken);

    router.post('/reportes/:reporteId/comentarios', async (req, res, next) => {
        const reporteId = Number(req.params.reporteId);
        const { contenido } = req.body || {};

        if (!Number.isInteger(reporteId) || reporteId < 1) {
            return res.status(400).json({ status: 'error', message: 'El identificador del reporte no es válido' });
        }

        if (typeof contenido !== 'string' || !contenido.trim() || contenido.trim().length > 5000) {
            return res.status(400).json({
                status: 'error',
                message: 'El comentario es obligatorio y no puede superar los 5000 caracteres'
            });
        }

        try {
            const reporte = await prisma.reporte.findUnique({
                where: { id: reporteId },
                select: { id: true }
            });

            if (!reporte) {
                return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
            }

            const comentario = await prisma.comentario.create({
                data: {
                    reporteId,
                    usuarioId: Number(req.usuario.id),
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
    });

    router.get('/reportes/:reporteId/comentarios', async (req, res, next) => {
        const reporteId = Number(req.params.reporteId);

        if (!Number.isInteger(reporteId) || reporteId < 1) {
            return res.status(400).json({ status: 'error', message: 'El identificador del reporte no es válido' });
        }

        try {
            const reporte = await prisma.reporte.findUnique({
                where: { id: reporteId },
                select: { id: true }
            });

            if (!reporte) {
                return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
            }

            const comentarios = await prisma.comentario.findMany({
                where: { reporteId },
                include: { usuario: { select: { nombre: true } } },
                orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }]
            });

            return res.json({
                status: 'success',
                total: comentarios.length,
                data: comentarios.map(serializarComentario)
            });
        } catch (error) {
            return next(error);
        }
    });

    router.delete('/comentarios/:id', async (req, res, next) => {
        const comentarioId = Number(req.params.id);

        if (!Number.isInteger(comentarioId) || comentarioId < 1) {
            return res.status(400).json({ status: 'error', message: 'El identificador del comentario no es válido' });
        }

        try {
            const comentario = await prisma.comentario.findUnique({
                where: { id: comentarioId },
                select: { usuarioId: true }
            });

            if (!comentario) {
                return res.status(404).json({ status: 'error', message: 'Comentario no encontrado' });
            }

            if (String(comentario.usuarioId) !== String(req.usuario.id)) {
                return res.status(403).json({ status: 'error', message: 'No puedes eliminar un comentario ajeno' });
            }

            await prisma.comentario.deleteMany({
                where: { id: comentarioId, usuarioId: comentario.usuarioId }
            });

            return res.json({ status: 'success', message: 'Comentario eliminado' });
        } catch (error) {
            return next(error);
        }
    });

    return router;
};

function serializarComentario(comentario) {
    return {
        id: comentario.id,
        reporte_id: comentario.reporteId,
        usuario_id: comentario.usuarioId,
        autor: comentario.usuario.nombre,
        contenido: comentario.contenido,
        creado_en: comentario.creadoEn
    };
}