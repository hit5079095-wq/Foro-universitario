const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authorization = req.get('Authorization');
    const coincidencia = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

    if (!coincidencia) {
        return res.status(401).json({
            status: 'error',
            message: 'Token de autenticación requerido'
        });
    }

    try {
        const payload = jwt.verify(coincidencia[1], process.env.JWT_SECRET);

        if (
            typeof payload !== 'object' ||
            payload === null ||
            payload.id === undefined ||
            typeof payload.nombre !== 'string'
        ) {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido o expirado'
            });
        }

        req.usuario = { id: payload.id, nombre: payload.nombre };
        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado'
        });
    }
};
