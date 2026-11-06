const PUBLICO = { id: true, nombre: true, correo: true, rol: true, creadoEn: true };
const RESUMEN = { id: true, nombre: true, rol: true, creadoEn: true };

module.exports = (prisma) => ({
    // Incluye passwordHash: solo para autenticación.
    buscarPorCorreo(correo) {
        return prisma.usuario.findUnique({ where: { correo } });
    },

    buscarPorId(id) {
        return prisma.usuario.findUnique({ where: { id }, select: PUBLICO });
    },

    async existe(id) {
        return Boolean(await prisma.usuario.findUnique({ where: { id }, select: { id: true } }));
    },

    async obtenerPasswordHash(id) {
        const usuario = await prisma.usuario.findUnique({ where: { id }, select: { passwordHash: true } });
        return usuario ? usuario.passwordHash : null;
    },

    // Lanza P2002 si el correo ya existe.
    crear({ nombre, correo, passwordHash, rol }) {
        return prisma.usuario.create({ data: { nombre, correo, passwordHash, rol }, select: PUBLICO });
    },

    actualizarNombre(id, nombre) {
        return prisma.usuario.update({ where: { id }, data: { nombre }, select: PUBLICO });
    },

    async actualizarPasswordHash(id, passwordHash) {
        await prisma.usuario.update({ where: { id }, data: { passwordHash } });
    },

    listar() {
        return prisma.usuario.findMany({ select: RESUMEN, orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }] });
    },

    actualizarRol(id, rol) {
        return prisma.usuario.update({ where: { id }, data: { rol }, select: RESUMEN });
    }
});
