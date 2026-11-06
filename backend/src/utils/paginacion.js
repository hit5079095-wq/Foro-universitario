const ErrorHttp = require('./ErrorHttp');

const MENSAJE_PAGINACION_INVALIDA = 'La página y el límite deben ser enteros positivos y estar dentro del rango permitido';

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

function errorIdInvalido(entidad) {
    return new ErrorHttp(400, `El identificador ${entidad} no es válido`);
}

// Devuelve el id o lanza el 400 "El identificador ... no es válido".
function exigirId(valor, entidad) {
    const id = obtenerIdPositivo(valor);
    if (!id) throw errorIdInvalido(entidad);
    return id;
}

// Lee pagina/limite de la query; lanza 400 si no son válidos.
function obtenerPaginacion(query = {}) {
    const pagina = query.pagina === undefined ? 1 : obtenerIdPositivo(query.pagina);
    const limite = obtenerLimite(query.limite);
    if (!pagina || !limite || !Number.isSafeInteger((pagina - 1) * limite)) {
        throw new ErrorHttp(400, MENSAJE_PAGINACION_INVALIDA);
    }
    return { pagina, limite, skip: (pagina - 1) * limite, take: limite };
}

function respuestaPaginada(message, { total, pagina, limite }, data) {
    return {
        status: 'success',
        message,
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
        data
    };
}

module.exports = { obtenerIdPositivo, obtenerLimite, errorIdInvalido, exigirId, obtenerPaginacion, respuestaPaginada };
