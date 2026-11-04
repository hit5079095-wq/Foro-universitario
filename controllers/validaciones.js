function obtenerIdPositivo(valor) {
    if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
        return null;
    }

    const id = Number(valor);
    return Number.isSafeInteger(id) ? id : null;
}

function responderIdInvalido(res, entidad) {
    return res.status(400).json({
        status: 'error',
        message: `El identificador ${entidad} no es válido`
    });
}

module.exports = { obtenerIdPositivo, responderIdInvalido };
