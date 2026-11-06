function obtenerIdPositivo(valor) {
    if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) {
        return null;
    }

    const id = Number(valor);
    return Number.isSafeInteger(id) ? id : null;
}

function obtenerLimite(valor, predeterminado = 10) {
    if (valor === undefined) return predeterminado;
    if (typeof valor !== 'string' || !/^[1-9]\d*$/.test(valor)) return null;

    return valor.length > 2 || Number(valor) > 50 ? 50 : Number(valor);
}

function responderIdInvalido(res, entidad) {
    return res.status(400).json({
        status: 'error',
        message: `El identificador ${entidad} no es válido`,
        data: null
    });
}

module.exports = { obtenerIdPositivo, obtenerLimite, responderIdInvalido };
