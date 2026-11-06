const prisma = require('../lib/prisma');
const { obtenerIdPositivo, responderIdInvalido } = require('./validaciones');

async function listar(req, res, next) {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { id: 'asc' }
        });
        return res.json({
            status: 'success',
            message: 'Categorías obtenidas',
            total: categorias.length,
            data: categorias
        });
    } catch (error) {
        return next(error);
    }
}

async function crear(req, res, next) {
    try {
        const repetida = await prisma.categoria.findFirst({
            where: { nombre: { equals: req.body.nombre, mode: 'insensitive' } },
            select: { id: true }
        });
        if (repetida) {
            return res.status(409).json({
                status: 'error',
                message: 'Ya existe una categoría con ese nombre',
                data: null
            });
        }

        const categoria = await prisma.categoria.create({
            data: { nombre: req.body.nombre }
        });
        return res.status(201).json({
            status: 'success',
            message: 'Categoría creada',
            data: categoria
        });
    } catch (error) {
        return next(error);
    }
}

async function editar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'de categoría');

    try {
        const repetida = await prisma.categoria.findFirst({
            where: {
                nombre: { equals: req.body.nombre, mode: 'insensitive' },
                id: { not: id }
            },
            select: { id: true }
        });
        if (repetida) {
            return res.status(409).json({
                status: 'error',
                message: 'Ya existe una categoría con ese nombre',
                data: null
            });
        }

        const categoria = await prisma.categoria.update({
            where: { id },
            data: { nombre: req.body.nombre }
        });
        return res.json({ status: 'success', message: 'Categoría actualizada', data: categoria });
    } catch (error) {
        return next(error);
    }
}

async function eliminar(req, res, next) {
    const id = obtenerIdPositivo(req.params.id);
    if (!id) return responderIdInvalido(res, 'de categoría');

    try {
        const categoria = await prisma.categoria.findUnique({
            where: { id },
            select: { _count: { select: { reportes: true } } }
        });
        if (!categoria) {
            return res.status(404).json({ status: 'error', message: 'Categoría no encontrada', data: null });
        }
        if (categoria._count.reportes > 0) {
            return res.status(409).json({
                status: 'error',
                message: 'No se puede eliminar la categoría porque tiene reportes asociados',
                data: null
            });
        }

        await prisma.categoria.delete({ where: { id } });
        return res.json({ status: 'success', message: 'Categoría eliminada', data: null });
    } catch (error) {
        if (error.code === 'P2003') {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede eliminar la categoría porque tiene reportes asociados',
                data: null
            });
        }
        return next(error);
    }
}

module.exports = { listar, crear, editar, eliminar };
