const { obtenerStore, siguienteId } = require('../../database/memoria/store');
const { errorDuplicado, errorNoEncontrado } = require('../errores');

const copiar = (c) => ({ id: c.id, nombre: c.nombre });

function buscar(id) {
    const categoria = obtenerStore().categorias.find((c) => c.id === id);
    if (!categoria) throw errorNoEncontrado('Categoría no encontrada');
    return categoria;
}

module.exports = {
    async listar() {
        return [...obtenerStore().categorias].sort((a, b) => a.id - b.id).map(copiar);
    },

    async existe(id) {
        return obtenerStore().categorias.some((c) => c.id === id);
    },

    async buscarPorNombre(nombre, { excluirId } = {}) {
        const buscado = nombre.toLowerCase();
        const categoria = obtenerStore().categorias.find((c) => c.nombre.toLowerCase() === buscado && c.id !== excluirId);
        return categoria ? { id: categoria.id } : null;
    },

    async contarReportes(id) {
        const store = obtenerStore();
        if (!store.categorias.some((c) => c.id === id)) return null;
        return store.reportes.filter((r) => r.categoriaId === id).length;
    },

    async crear({ nombre }) {
        const store = obtenerStore();
        if (store.categorias.some((c) => c.nombre === nombre)) throw errorDuplicado('Categoría duplicada');
        const categoria = { id: siguienteId('categoria'), nombre };
        store.categorias.push(categoria);
        return copiar(categoria);
    },

    async actualizar(id, { nombre }) {
        const categoria = buscar(id);
        categoria.nombre = nombre;
        return copiar(categoria);
    },

    async eliminar(id) {
        const store = obtenerStore();
        buscar(id);
        store.categorias = store.categorias.filter((c) => c.id !== id);
    }
};
