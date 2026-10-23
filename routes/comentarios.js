const express = require('express');
const verificarToken = require('../middleware/verificarToken');

module.exports = (db) => {
    const router = express.Router();
    const connection = db.promise();

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
            const [reportes] = await connection.query(
                'SELECT id FROM reportes WHERE id = ? LIMIT 1',
                [reporteId]
            );

            if (reportes.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
            }

            const [resultado] = await connection.query(
                'INSERT INTO comentarios (reporte_id, usuario_id, contenido) VALUES (?, ?, ?)',
                [reporteId, req.usuario.id, contenido.trim()]
            );

            const [comentarios] = await connection.query(
                `SELECT c.id, c.reporte_id, c.usuario_id, u.nombre AS autor, c.contenido, c.creado_en
                 FROM comentarios c
                 INNER JOIN usuarios u ON u.id = c.usuario_id
                 WHERE c.id = ? LIMIT 1`,
                [resultado.insertId]
            );

            return res.status(201).json({
                status: 'success',
                message: 'Comentario creado',
                data: comentarios[0]
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
            const [reportes] = await connection.query(
                'SELECT id FROM reportes WHERE id = ? LIMIT 1',
                [reporteId]
            );

            if (reportes.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Reporte no encontrado' });
            }

            const [comentarios] = await connection.query(
                `SELECT c.id, c.reporte_id, c.usuario_id, u.nombre AS autor, c.contenido, c.creado_en
                 FROM comentarios c
                 INNER JOIN usuarios u ON u.id = c.usuario_id
                 WHERE c.reporte_id = ?
                 ORDER BY c.creado_en ASC, c.id ASC`,
                [reporteId]
            );

            return res.json({ status: 'success', total: comentarios.length, data: comentarios });
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
            const [comentarios] = await connection.query(
                'SELECT usuario_id FROM comentarios WHERE id = ? LIMIT 1',
                [comentarioId]
            );

            if (comentarios.length === 0) {
                return res.status(404).json({ status: 'error', message: 'Comentario no encontrado' });
            }

            if (String(comentarios[0].usuario_id) !== String(req.usuario.id)) {
                return res.status(403).json({ status: 'error', message: 'No puedes eliminar un comentario ajeno' });
            }

            await connection.query(
                'DELETE FROM comentarios WHERE id = ? AND usuario_id = ?',
                [comentarioId, req.usuario.id]
            );

            return res.json({ status: 'success', message: 'Comentario eliminado' });
        } catch (error) {
            return next(error);
        }
    });

    return router;
};