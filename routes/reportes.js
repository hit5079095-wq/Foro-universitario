const express = require('express');
const verificarToken = require('../middleware/verificarToken');

const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';

module.exports = (prisma) => {
    const router = express.Router();

    router.use(verificarToken);

    router.post('/', async (req, res) => {
        const { titulo, descripcion, categoria_id: categoriaId } = req.body || {};

        if (
            typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150 ||
            typeof descripcion !== 'string' || !descripcion.trim() ||
            !Number.isInteger(categoriaId) || categoriaId < 1
        ) {
            return res.status(400).json({
                status: 'error',
                message: 'Título (máximo 150 caracteres), descripción y una categoría válida son obligatorios'
            });
        }

        try {
            const categoria = await prisma.categoria.findUnique({
                where: { id: categoriaId },
                select: { id: true }
            });

            if (!categoria) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La categoría indicada no existe'
                });
            }

            const reporte = await prisma.reporte.create({
                data: {
                    titulo: titulo.trim(),
                    descripcion: descripcion.trim(),
                    categoriaId,
                    usuarioId: Number(req.usuario.id)
                },
                include: {
                    categoria: { select: { nombre: true } },
                    usuario: { select: { nombre: true } }
                }
            });

            return res.status(201).json({
                status: 'success',
                message: 'Reporte creado',
                data: serializarReporte(reporte)
            });
        } catch (error) {
            console.error('Error al crear reporte:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const reportes = await prisma.reporte.findMany({
                include: {
                    categoria: { select: { nombre: true } },
                    usuario: { select: { nombre: true } }
                },
                orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }]
            });

            return res.json({
                status: 'success',
                total: reportes.length,
                data: reportes.map(serializarReporte)
            });
        } catch (error) {
            console.error('Error al listar reportes:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.get('/:id', async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                status: 'error',
                message: 'El identificador del reporte no es válido'
            });
        }

        try {
            const reporte = await prisma.reporte.findUnique({
                where: { id },
                include: {
                    categoria: { select: { nombre: true } },
                    usuario: { select: { nombre: true } }
                }
            });

            if (!reporte) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reporte no encontrado'
                });
            }

            return res.json({ status: 'success', data: serializarReporte(reporte) });
        } catch (error) {
            console.error('Error al obtener el reporte:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.patch('/:id/estado', async (req, res, next) => {
        const id = Number(req.params.id);
        const { estado } = req.body || {};
        const estadosPermitidos = ['pendiente', 'en_proceso', 'resuelto'];

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ status: 'error', message: 'El identificador del reporte no es válido' });
        }

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                status: 'error',
                message: `El estado debe ser uno de: ${estadosPermitidos.join(', ')}`
            });
        }

        try {
            const resultado = await prisma.reporte.updateMany({
                where: { id },
                data: { estado }
            });

            if (resultado.count === 0) {
                return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
            }

            return res.json({ status: 'success', message: 'Estado actualizado', data: { id, estado } });
        } catch (error) {
            return next(error);
        }
    });

    return router;
};

function serializarReporte(reporte) {
    return {
        id: reporte.id,
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        categoria_id: reporte.categoriaId,
        categoria: reporte.categoria.nombre,
        usuario_id: reporte.usuarioId,
        autor: reporte.usuario.nombre,
        estado: reporte.estado,
        creado_en: reporte.creadoEn
    };
}
