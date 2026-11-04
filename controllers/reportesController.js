const prisma = require('../lib/prisma');
const { obtenerIdPositivo, responderIdInvalido } = require('./validaciones');

const ESTADOS_PERMITIDOS = ['pendiente', 'en_proceso', 'resuelto'];

const relacionesReporte = {
    categoria: { select: { id: true, nombre: true } },
    usuario: { select: { nombre: true } },
    _count: { select: { comentarios: true } }
};

function serializarReporte(reporte) {
    return {
        id: reporte.id,
        titulo: reporte.titulo,
        descripcion: reporte.descripcion,
        categoriaId: reporte.categoriaId,
        categoria: reporte.categoria,
        usuarioId: reporte.usuarioId,
        autor: reporte.usuario.nombre,
        estado: reporte.estado,
        creadoEn: reporte.creadoEn,
        totalComentarios: reporte._count.comentarios
    };
}

async function listar(req, res, next) {
    const pagina = req.query.pagina === undefined ? 1 : obtenerIdPositivo(req.query.pagina);
    const limite = req.query.limite === undefined ? 10 : obtenerIdPositivo(req.query.limite);
    const categoriaId = req.query.categoriaId === undefined
        ? undefined
        : obtenerIdPositivo(req.query.categoriaId);

    if (!pagina || !limite || !Number.isSafeInteger((pagina - 1) * limite)) {
        return res.status(400).json({
            status: 'error',
            message: 'La página y el límite deben ser enteros positivos y estar dentro del rango permitido'
        });
    }

    if (req.query.categoriaId !== undefined && !categoriaId) {
        return res.status(400).json({ status: 'error', message: 'El identificador de categoría no es válido' });
    }

    if (req.query.estado !== undefined && !ESTADOS_PERMITIDOS.includes(req.query.estado)) {
        return res.status(400).json({
            status: 'error',
            message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`
        });
    }

    const where = {
        ...(categoriaId === undefined ? {} : { categoriaId }),
        ...(req.query.estado === undefined ? {} : { estado: req.query.estado })
    };

    try {
        const [total, reportes] = await prisma.$transaction([
            prisma.reporte.count({ where }),
            prisma.reporte.findMany({
                where,
                include: relacionesReporte,
                orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
                skip: (pagina - 1) * limite,
                take: limite
            })
        ]);

        return res.json({
            status: 'success',
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
                ...relacionesReporte,
                comentarios: {
                    orderBy: [{ creadoEn: 'asc' }, { id: 'asc' }],
                    include: { usuario: { select: { nombre: true } } }
                }
            }
        });

        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
        }

        return res.json({
            status: 'success',
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

    if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150 ||
        typeof descripcion !== 'string' || !descripcion.trim() ||
        !idCategoria || idCategoria < 1) {
        return res.status(400).json({
            status: 'error',
            message: 'Título (máximo 150 caracteres), descripción y una categoría válida son obligatorios'
        });
    }

    try {
        const categoria = await prisma.categoria.findUnique({
            where: { id: idCategoria },
            select: { id: true }
        });

        if (!categoria) {
            return res.status(400).json({ status: 'error', message: 'La categoría indicada no existe' });
        }

        const reporte = await prisma.reporte.create({
            data: {
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                categoriaId: idCategoria,
                usuarioId: req.usuario.id
            },
            include: relacionesReporte
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
    if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 150 ||
        typeof descripcion !== 'string' || !descripcion.trim()) {
        return res.status(400).json({
            status: 'error',
            message: 'Título (máximo 150 caracteres) y descripción son obligatorios'
        });
    }

    try {
        const reporte = await prisma.reporte.findUnique({
            where: { id },
            select: { usuarioId: true }
        });

        if (!reporte) {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
        }
        if (reporte.usuarioId !== req.usuario.id) {
            return res.status(403).json({ status: 'error', message: 'No puedes editar un reporte ajeno' });
        }

        const actualizado = await prisma.reporte.update({
            where: { id },
            data: { titulo: titulo.trim(), descripcion: descripcion.trim() },
            include: relacionesReporte
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
            message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`
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
            if (reporte.usuarioId !== req.usuario.id) return { tipo: 'prohibido' };

            await tx.comentario.deleteMany({ where: { reporteId: id } });
            await tx.reporte.delete({ where: { id } });
            return { tipo: 'eliminado' };
        });

        if (resultado.tipo === 'no-encontrado') {
            return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
        }
        if (resultado.tipo === 'prohibido') {
            return res.status(403).json({ status: 'error', message: 'No puedes eliminar un reporte ajeno' });
        }

        return res.json({ status: 'success', message: 'Reporte eliminado' });
    } catch (error) {
        return next(error);
    }
}

module.exports = { listar, obtener, crear, editar, actualizarEstado, eliminar };
