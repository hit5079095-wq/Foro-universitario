const express = require('express');
const verificarToken = require('../middleware/verificarToken');

const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';

module.exports = (db) => {
    const router = express.Router();
    const connection = db.promise();

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
            const [categorias] = await connection.query(
                'SELECT id FROM categorias WHERE id = ? LIMIT 1',
                [categoriaId]
            );

            if (categorias.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La categoría indicada no existe'
                });
            }

            const [resultado] = await connection.query(
                'INSERT INTO reportes (titulo, descripcion, categoria_id, usuario_id) VALUES (?, ?, ?, ?)',
                [titulo.trim(), descripcion.trim(), categoriaId, req.usuario.id]
            );

            const [reportes] = await connection.query(
                `SELECT r.id, r.titulo, r.descripcion, r.categoria_id, c.nombre AS categoria,
                    r.usuario_id, u.nombre AS autor, r.estado, r.creado_en
                 FROM reportes r
                 INNER JOIN categorias c ON c.id = r.categoria_id
                 INNER JOIN usuarios u ON u.id = r.usuario_id
                 WHERE r.id = ? LIMIT 1`,
                [resultado.insertId]
            );

            return res.status(201).json({
                status: 'success',
                message: 'Reporte creado',
                data: reportes[0]
            });
        } catch (error) {
            console.error('Error al crear reporte:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const [reportes] = await connection.query(
                `SELECT r.id, r.titulo, r.descripcion, r.categoria_id, c.nombre AS categoria,
                    r.usuario_id, u.nombre AS autor, r.estado, r.creado_en
                 FROM reportes r
                 INNER JOIN categorias c ON c.id = r.categoria_id
                 INNER JOIN usuarios u ON u.id = r.usuario_id
                 ORDER BY r.creado_en DESC, r.id DESC`
            );

            return res.json({
                status: 'success',
                total: reportes.length,
                data: reportes
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
            const [reportes] = await connection.query(
                `SELECT r.id, r.titulo, r.descripcion, r.categoria_id, c.nombre AS categoria,
                    r.usuario_id, u.nombre AS autor, r.estado, r.creado_en
                 FROM reportes r
                 INNER JOIN categorias c ON c.id = r.categoria_id
                 INNER JOIN usuarios u ON u.id = r.usuario_id
                 WHERE r.id = ? LIMIT 1`,
                [id]
            );

            if (reportes.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Reporte no encontrado'
                });
            }

            return res.json({ status: 'success', data: reportes[0] });
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
            const [resultado] = await connection.query(
                'UPDATE reportes SET estado = ? WHERE id = ?',
                [estado, id]
            );

            if (resultado.affectedRows === 0) {
                const [reportes] = await connection.query(
                    'SELECT id FROM reportes WHERE id = ? LIMIT 1',
                    [id]
                );

                if (reportes.length === 0) {
                    return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
                }
            }

            return res.json({ status: 'success', message: 'Estado actualizado', data: { id, estado } });
        } catch (error) {
            return next(error);
        }
    });

    return router;
};
