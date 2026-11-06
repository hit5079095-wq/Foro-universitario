module.exports = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            status: 'error',
            message: 'El cuerpo de la petición no es un JSON válido',
            data: null
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Recurso no encontrado', data: null });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'El recurso ya existe', data: null });
    }

    if (err.code === 'P2003') {
        return res.status(400).json({ status: 'error', message: 'La referencia indicada no es válida', data: null });
    }

    console.error(err);
    return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        data: null
    });
};