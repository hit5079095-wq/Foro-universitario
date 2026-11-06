const prisma = require('../lib/prisma');
const { obtenerIdPositivo, responderIdInvalido } = require('./validaciones');

async function crear(req, res, next) {
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

        const voto = await prisma.voto.create({
            data: { reporteId, usuarioId: req.usuario.id },
            select: { reporteId: true, usuarioId: true, creadoEn: true }
        });
        return res.status(201).json({
            status: 'success',
            message: 'Voto registrado',
            data: voto
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'Ya votaste por este reporte',
                data: null
            });
        }
        return next(error);
    }
}

async function eliminar(req, res, next) {
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

        await prisma.voto.deleteMany({
            where: { reporteId, usuarioId: req.usuario.id }
        });
        return res.json({ status: 'success', message: 'Voto eliminado', data: null });
    } catch (error) {
        return next(error);
    }
}

module.exports = { crear, eliminar };
