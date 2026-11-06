const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const secreto = process.env.JWT_SECRET;
    if (typeof secreto !== 'string' || !secreto.trim()) {
        return next(new Error('JWT_SECRET no está configurado en el entorno del servidor'));
    }

    const authorization = req.get('Authorization');
    const coincidencia = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

    if (!coincidencia) {
        return res.status(401).json({
            status: 'error',
            message: 'Token de autenticación requerido',
            data: null
        });
    }

    try {
        const payload = jwt.verify(coincidencia[1], secreto, { algorithms: ['HS256'] });

        if (
            typeof payload !== 'object' ||
            payload === null ||
            !Number.isSafeInteger(payload.id) ||
            payload.id < 1 ||
            typeof payload.nombre !== 'string'
        ) {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido',
                data: null
            });
        }

        req.usuario = {
            id: payload.id,
            nombre: payload.nombre,
            rol: payload.rol === 'admin' ? 'admin' : 'estudiante'
        };
        return next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                status: 'error',
                message: 'Token expirado',
                data: { codigo: 'TOKEN_EXPIRADO' }
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Token inválido',
            data: null
        });
    }
};
