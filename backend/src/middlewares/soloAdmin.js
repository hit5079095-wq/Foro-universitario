module.exports = (req, res, next) => {
    if (req.usuario?.rol !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Se requieren permisos de administrador',
            data: null
        });
    }

    return next();
};
