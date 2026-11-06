const { obtenerStore, siguienteId } = require('../../database/memoria/store');
const { autor, comparar, incluye, enriquecerReporte } = require('./comun');
const { errorNoEncontrado } = require('../errores');
const { esAutorOAdmin } = require('../../utils/permisos');

const porId = (id) => obtenerStore().reportes.find((r) => r.id === id);
const tiempo = (fecha) => new Date(fecha).getTime();

function cumpleFiltros(reporte, { categoriaId, usuarioId, estado, ubicacion, q } = {}) {
    if (categoriaId !== undefined && reporte.categoriaId !== categoriaId) return false;
    if (usuarioId !== undefined && reporte.usuarioId !== usuarioId) return false;
    if (estado !== undefined && reporte.estado !== estado) return false;
    if (ubicacion && !incluye(reporte.ubicacion, ubicacion)) return false;
    if (q && !incluye(reporte.titulo, q) && !incluye(reporte.descripcion, q)) return false;
    return true;
}

// Criterio de desempate común: más reciente primero y luego id descendente.
const recientes = (a, b) => comparar(tiempo(a.creadoEn), tiempo(b.creadoEn), 'desc') || b.id - a.id;

const ORDENES = {
    recientes,
    antiguos: (a, b) => comparar(tiempo(a.creadoEn), tiempo(b.creadoEn), 'asc') || a.id - b.id,
    mas_comentados: (a, b) => b._count.comentarios - a._count.comentarios || recientes(a, b),
    mas_apoyados: (a, b) => b._count.votos - a._count.votos || recientes(a, b)
};

module.exports = {
    async listar({ filtros = {}, orden = 'recientes', skip = 0, take = 10, usuarioActualId } = {}) {
        const items = obtenerStore().reportes
            .filter((r) => cumpleFiltros(r, filtros))
            .map((r) => enriquecerReporte(r, usuarioActualId))
            .sort(ORDENES[orden] || ORDENES.recientes);
        return { total: items.length, items: items.slice(skip, skip + take) };
    },

    async buscarPorId(id, { usuarioActualId, conComentarios = false } = {}) {
        const reporte = porId(id);
        if (!reporte) return null;
        const resultado = enriquecerReporte(reporte, usuarioActualId);
        if (conComentarios) {
            resultado.comentarios = obtenerStore().comentarios
                .filter((c) => c.reporteId === id)
                .sort((a, b) => comparar(tiempo(a.creadoEn), tiempo(b.creadoEn), 'asc') || a.id - b.id)
                .map((c) => ({ ...c, usuario: autor(c.usuarioId) }));
        }
        return resultado;
    },

    async existe(id) {
        return Boolean(porId(id));
    },

    async obtenerAutor(id) {
        const reporte = porId(id);
        return reporte ? { usuarioId: reporte.usuarioId } : null;
    },

    async crear(datos, usuarioActualId) {
        const ahora = new Date();
        const reporte = {
            id: siguienteId('reporte'),
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            categoriaId: datos.categoriaId,
            usuarioId: datos.usuarioId,
            estado: datos.estado ?? 'pendiente',
            ubicacion: datos.ubicacion ?? null,
            imagenUrl: datos.imagenUrl ?? null,
            creadoEn: ahora,
            actualizadoEn: ahora
        };
        obtenerStore().reportes.push(reporte);
        return enriquecerReporte(reporte, usuarioActualId);
    },

    async actualizar(id, datos, usuarioActualId) {
        const reporte = porId(id);
        if (!reporte) throw errorNoEncontrado('Reporte no encontrado');
        for (const campo of ['titulo', 'descripcion', 'estado', 'ubicacion', 'imagenUrl']) {
            if (Object.hasOwn(datos, campo)) reporte[campo] = datos[campo] ?? null;
        }
        reporte.actualizadoEn = new Date();
        return enriquecerReporte(reporte, usuarioActualId);
    },

    async actualizarEstadoConHistorial({ id, estado, usuarioId, rol }) {
        const reporte = porId(id);
        if (!reporte) return { tipo: 'no-encontrado' };
        if (!esAutorOAdmin(reporte.usuarioId, { id: usuarioId, rol })) return { tipo: 'prohibido' };

        const estadoAnterior = reporte.estado;
        reporte.estado = estado;
        reporte.actualizadoEn = new Date();
        if (estadoAnterior !== estado) {
            obtenerStore().historialEstados.push({
                id: siguienteId('historialEstado'),
                reporteId: id,
                usuarioId,
                estadoAnterior,
                estadoNuevo: estado,
                creadoEn: new Date()
            });
        }
        return { tipo: 'actualizado', reporte: enriquecerReporte(reporte, usuarioId) };
    },

    // Borra el reporte junto con sus comentarios, votos e historial (como el ON DELETE CASCADE real).
    async eliminarConComentarios({ id, usuarioId, rol }) {
        const store = obtenerStore();
        const reporte = porId(id);
        if (!reporte) return { tipo: 'no-encontrado' };
        if (!esAutorOAdmin(reporte.usuarioId, { id: usuarioId, rol })) return { tipo: 'prohibido' };

        store.comentarios = store.comentarios.filter((c) => c.reporteId !== id);
        store.votos = store.votos.filter((v) => v.reporteId !== id);
        store.historialEstados = store.historialEstados.filter((h) => h.reporteId !== id);
        store.reportes = store.reportes.filter((r) => r.id !== id);
        return { tipo: 'eliminado' };
    }
};
