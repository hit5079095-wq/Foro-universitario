const { obtenerRepositorios } = require('../repositories');
const ErrorHttp = require('../utils/ErrorHttp');
const { obtenerIdPositivo, obtenerPaginacion } = require('../utils/paginacion');
const { serializarReporte, serializarComentario, serializarHistorial } = require('../utils/serializadores');

const ESTADOS_PERMITIDOS = ['pendiente', 'en_proceso', 'resuelto'];
const ORDENAMIENTOS = ['recientes', 'antiguos', 'mas_comentados', 'mas_apoyados'];
const MENSAJE_ESTADO_INVALIDO = `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`;

const repos = () => obtenerRepositorios();
const noEncontrado = () => new ErrorHttp(404, 'Reporte no encontrado');

// Valida la query del listado (mismo orden y mensajes que la API original) y devuelve los criterios.
function leerCriterios(query = {}) {
    const paginacion = obtenerPaginacion(query);
    const categoriaId = query.categoriaId === undefined ? undefined : obtenerIdPositivo(query.categoriaId);
    const usuarioId = query.usuarioId === undefined ? undefined : obtenerIdPositivo(query.usuarioId);
    const { ubicacion, q } = query;
    const orden = query.orden === undefined ? 'recientes' : query.orden;

    if (query.categoriaId !== undefined && !categoriaId) {
        throw new ErrorHttp(400, 'El identificador de categoría no es válido');
    }
    if (query.usuarioId !== undefined && !usuarioId) {
        throw new ErrorHttp(400, 'El identificador de usuario no es válido');
    }
    if (q !== undefined && typeof q !== 'string') {
        throw new ErrorHttp(400, 'El parámetro q debe ser texto');
    }
    if (ubicacion !== undefined && typeof ubicacion !== 'string') {
        throw new ErrorHttp(400, 'El parámetro ubicacion debe ser texto');
    }
    if (!ORDENAMIENTOS.includes(orden)) {
        throw new ErrorHttp(400, `El orden debe ser uno de: ${ORDENAMIENTOS.join(', ')}`);
    }
    if (query.estado !== undefined && !ESTADOS_PERMITIDOS.includes(query.estado)) {
        throw new ErrorHttp(400, MENSAJE_ESTADO_INVALIDO);
    }

    const filtros = {};
    if (categoriaId !== undefined) filtros.categoriaId = categoriaId;
    if (usuarioId !== undefined) filtros.usuarioId = usuarioId;
    if (query.estado !== undefined) filtros.estado = query.estado;
    if (ubicacion !== undefined && ubicacion.trim()) filtros.ubicacion = ubicacion.trim();
    if (q !== undefined && q.trim()) filtros.q = q.trim();

    return { paginacion, filtros, orden };
}

// usuarioIdForzado (mis reportes / reportes de un usuario) tiene prioridad sobre ?usuarioId.
async function listar(query, { usuarioActualId, usuarioIdForzado } = {}) {
    const { paginacion, filtros, orden } = leerCriterios(query);
    if (usuarioIdForzado !== undefined) filtros.usuarioId = usuarioIdForzado;

    const { total, items } = await repos().reporte.listar({
        filtros,
        orden,
        skip: paginacion.skip,
        take: paginacion.take,
        usuarioActualId
    });
    return { total, pagina: paginacion.pagina, limite: paginacion.limite, items: items.map(serializarReporte) };
}

async function obtener(id, usuarioActualId) {
    const reporte = await repos().reporte.buscarPorId(id, { usuarioActualId, conComentarios: true });
    if (!reporte) throw noEncontrado();
    return { ...serializarReporte(reporte), comentarios: reporte.comentarios.map(serializarComentario) };
}

async function crear(datos = {}, usuario) {
    const { titulo, descripcion, categoriaId } = datos;
    const idCategoria = Number.isSafeInteger(categoriaId) ? categoriaId : null;

    if (typeof titulo !== 'string' || titulo.trim().length < 5 || titulo.trim().length > 120 ||
        typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 1000 ||
        !idCategoria || idCategoria < 1) {
        throw new ErrorHttp(400, 'Título (5 a 120 caracteres), descripción (10 a 1000 caracteres) y una categoría válida son obligatorios');
    }

    if (!(await repos().categoria.existe(idCategoria))) {
        throw new ErrorHttp(400, 'La categoría indicada no existe');
    }

    const reporte = await repos().reporte.crear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoriaId: idCategoria,
        usuarioId: usuario.id,
        ubicacion: datos.ubicacion,
        imagenUrl: datos.imagenUrl
    }, usuario.id);
    return serializarReporte(reporte);
}

async function editar(id, datos = {}, usuario) {
    const { titulo, descripcion } = datos;
    if (typeof titulo !== 'string' || titulo.trim().length < 5 || titulo.trim().length > 120 ||
        typeof descripcion !== 'string' || descripcion.trim().length < 10 || descripcion.trim().length > 1000) {
        throw new ErrorHttp(400, 'Título (5 a 120 caracteres) y descripción (10 a 1000 caracteres) son obligatorios');
    }

    const reporte = await repos().reporte.obtenerAutor(id);
    if (!reporte) throw noEncontrado();
    if (reporte.usuarioId !== usuario.id) throw new ErrorHttp(403, 'No puedes editar un reporte ajeno');

    const actualizado = await repos().reporte.actualizar(id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        ...(Object.hasOwn(datos, 'ubicacion') ? { ubicacion: datos.ubicacion } : {}),
        ...(Object.hasOwn(datos, 'imagenUrl') ? { imagenUrl: datos.imagenUrl } : {})
    }, usuario.id);
    return serializarReporte(actualizado);
}

async function actualizarEstado(id, estado, usuario) {
    if (!ESTADOS_PERMITIDOS.includes(estado)) throw new ErrorHttp(400, MENSAJE_ESTADO_INVALIDO);

    const resultado = await repos().reporte.actualizarEstadoConHistorial({
        id,
        estado,
        usuarioId: usuario.id,
        rol: usuario.rol
    });
    if (resultado.tipo === 'no-encontrado') throw noEncontrado();
    if (resultado.tipo === 'prohibido') throw new ErrorHttp(403, 'No puedes cambiar el estado de un reporte ajeno');
    return serializarReporte(resultado.reporte);
}

async function eliminar(id, usuario) {
    const resultado = await repos().reporte.eliminarConComentarios({ id, usuarioId: usuario.id, rol: usuario.rol });
    if (resultado.tipo === 'no-encontrado') throw noEncontrado();
    if (resultado.tipo === 'prohibido') throw new ErrorHttp(403, 'No puedes eliminar un reporte ajeno');
}

async function historial(id) {
    if (!(await repos().reporte.existe(id))) throw noEncontrado();
    const cambios = await repos().historialEstado.listarPorReporte(id);
    return cambios.map(serializarHistorial);
}

module.exports = { listar, obtener, crear, editar, actualizarEstado, eliminar, historial, ESTADOS_PERMITIDOS };
