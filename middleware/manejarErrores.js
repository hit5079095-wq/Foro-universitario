module.exports = (err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({ status: 'error', message: 'El recurso ya existe' });
    }

    if (err.code === 'P2003') {
        return res.status(400).json({ status: 'error', message: 'La referencia indicada no es válida' });
    }

    const codigo = Number(err.status || err.statusCode);
    const statusCode = Number.isInteger(codigo) && codigo >= 400 && codigo < 600 ? codigo : 500;
    const message = statusCode === 500
        ? 'Error interno del servidor'
        : (statusCode === 400
            ? 'La solicitud no pudo procesarse'
            : (err.message || 'La solicitud no pudo procesarse'));

    return res.status(statusCode).json({ status: 'error', message });
};