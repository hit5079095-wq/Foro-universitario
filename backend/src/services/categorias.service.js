const { obtenerRepositorios } = require('../repositories');
const { esReferenciaInvalida } = require('../repositories/errores');
const ErrorHttp = require('../utils/ErrorHttp');

const MENSAJE_DUPLICADA = 'Ya existe una categoría con ese nombre';
const MENSAJE_CON_REPORTES = 'No se puede eliminar la categoría porque tiene reportes asociados';

const repos = () => obtenerRepositorios();

function listar() {
    return repos().categoria.listar();
}

async function crear({ nombre }) {
    if (await repos().categoria.buscarPorNombre(nombre)) throw new ErrorHttp(409, MENSAJE_DUPLICADA);
    return repos().categoria.crear({ nombre });
}

async function editar(id, { nombre }) {
    if (await repos().categoria.buscarPorNombre(nombre, { excluirId: id })) throw new ErrorHttp(409, MENSAJE_DUPLICADA);
    return repos().categoria.actualizar(id, { nombre });
}

async function eliminar(id) {
    const totalReportes = await repos().categoria.contarReportes(id);
    if (totalReportes === null) throw new ErrorHttp(404, 'Categoría no encontrada');
    if (totalReportes > 0) throw new ErrorHttp(409, MENSAJE_CON_REPORTES);

    try {
        await repos().categoria.eliminar(id);
    } catch (error) {
        // Un reporte creado entre la verificación y el borrado dispara la FK.
        if (esReferenciaInvalida(error)) throw new ErrorHttp(400, MENSAJE_CON_REPORTES);
        throw error;
    }
}

module.exports = { listar, crear, editar, eliminar };
