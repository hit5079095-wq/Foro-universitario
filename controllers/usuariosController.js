const prisma = require('../lib/prisma');
const reportesController = require('./reportesController');
const { obtenerIdPositivo, responderIdInvalido } = require('./validaciones');

async function listar(req, res, next) {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: { id: true, nombre: true, rol: true, creadoEn: true },
            orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
        });
        return res.json({
            status: 'success',
            message: 'Usuarios obtenidos',
            data: usuarios
        });
    } catch (error) {
        return next(error);
    }
}

async function listarReportes(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'del usuario');

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id },
            select: { id: true }
        });
        if (!usuario) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado', data: null });
        }
    } catch (error) {
        return next(error);
    }

    return reportesController.listarPorUsuario(req, res, next);
}

module.exports = { listar, listarReportes };
