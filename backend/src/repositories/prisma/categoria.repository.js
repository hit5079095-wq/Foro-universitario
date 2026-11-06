module.exports = (prisma) => ({
    listar() {
        return prisma.categoria.findMany({ orderBy: { id: 'asc' } });
    },

    async existe(id) {
        return Boolean(await prisma.categoria.findUnique({ where: { id }, select: { id: true } }));
    },

    // Búsqueda insensible a mayúsculas; excluirId permite ignorar la propia categoría al editar.
    buscarPorNombre(nombre, { excluirId } = {}) {
        return prisma.categoria.findFirst({
            where: {
                nombre: { equals: nombre, mode: 'insensitive' },
                ...(excluirId ? { id: { not: excluirId } } : {})
            },
            select: { id: true }
        });
    },

    // Devuelve la cantidad de reportes de la categoría o null si no existe.
    async contarReportes(id) {
        const categoria = await prisma.categoria.findUnique({
            where: { id },
            select: { _count: { select: { reportes: true } } }
        });
        return categoria ? categoria._count.reportes : null;
    },

    crear({ nombre }) {
        return prisma.categoria.create({ data: { nombre } });
    },

    actualizar(id, { nombre }) {
        return prisma.categoria.update({ where: { id }, data: { nombre } });
    },

    eliminar(id) {
        return prisma.categoria.delete({ where: { id } });
    }
});
