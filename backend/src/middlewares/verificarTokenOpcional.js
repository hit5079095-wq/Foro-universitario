const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authorization = req.get('Authorization');
    const coincidencia = authorization && authorization.match(/^Bearer\s+(\S+)$/i);
    const secreto = process.env.JWT_SECRET;

    if (!coincidencia || typeof secreto !== 'string' || !secreto.trim()) {
        return next();
    }

    try {
        const payload = jwt.verify(coincidencia[1], secreto, { algorithms: ['HS256'] });
        if (
            typeof payload === 'object' &&
            payload !== null &&
            Number.isSafeInteger(payload.id) &&
            payload.id > 0 &&
            typeof payload.nombre === 'string'
        ) {
            req.usuario = {
                id: payload.id,
                nombre: payload.nombre,
                rol: payload.rol === 'admin' ? 'admin' : 'estudiante'
            };
        }
    } catch (error) {
        if (!(error instanceof jwt.JsonWebTokenError)) {
            return next(error);
        }
    }

    return next();
};
