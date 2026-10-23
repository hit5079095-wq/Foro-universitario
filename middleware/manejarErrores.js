module.exports = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const codigo = Number(error.status || error.statusCode);
    const statusCode = Number.isInteger(codigo) && codigo >= 400 && codigo < 600 ? codigo : 500;
    const message = statusCode === 500
        ? 'Error interno del servidor'
        : (error.message || 'La solicitud no pudo procesarse');

    if (statusCode === 500) {
        console.error('Error no controlado:', error);
    }

    return res.status(statusCode).json({ status: 'error', message });
};