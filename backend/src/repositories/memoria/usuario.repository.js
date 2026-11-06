const { obtenerStore, siguienteId } = require('../../database/memoria/store');
const { comparar } = require('./comun');
const { errorDuplicado, errorNoEncontrado } = require('../errores');

const publico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol, creadoEn: u.creadoEn });
const resumen = (u) => ({ id: u.id, nombre: u.nombre, rol: u.rol, creadoEn: u.creadoEn });

const porId = (id) => obtenerStore().usuarios.find((u) => u.id === id);

function exigir(id) {
    const usuario = porId(id);
    if (!usuario) throw errorNoEncontrado('Usuario no encontrado');
    return usuario;
}

module.exports = {
    async buscarPorCorreo(correo) {
        const usuario = obtenerStore().usuarios.find((u) => u.correo.toLowerCase() === correo.toLowerCase());
        return usuario ? { ...usuario } : null;
    },

    async buscarPorId(id) {
        const usuario = porId(id);
        return usuario ? publico(usuario) : null;
    },

    async existe(id) {
        return Boolean(porId(id));
    },

    async obtenerPasswordHash(id) {
        return porId(id)?.passwordHash ?? null;
    },

    async crear({ nombre, correo, passwordHash, rol }) {
        const store = obtenerStore();
        if (store.usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
            throw errorDuplicado('El correo ya existe');
        }
        const usuario = { id: siguienteId('usuario'), nombre, correo, passwordHash, rol, creadoEn: new Date() };
        store.usuarios.push(usuario);
        return publico(usuario);
    },

    async actualizarNombre(id, nombre) {
        const usuario = exigir(id);
        usuario.nombre = nombre;
        return publico(usuario);
    },

    async actualizarPasswordHash(id, passwordHash) {
        exigir(id).passwordHash = passwordHash;
    },

    async listar() {
        return [...obtenerStore().usuarios]
            .sort((a, b) => comparar(a.creadoEn.getTime(), b.creadoEn.getTime(), 'desc') || b.id - a.id)
            .map(resumen);
    },

    async actualizarRol(id, rol) {
        const usuario = exigir(id);
        usuario.rol = rol;
        return resumen(usuario);
    }
};
