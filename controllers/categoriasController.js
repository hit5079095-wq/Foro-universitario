const prisma = require('../lib/prisma');

async function listar(req, res, next) {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: { id: 'asc' }
        });
        return res.json({ status: 'success', total: categorias.length, data: categorias });
    } catch (error) {
        return next(error);
    }
}

module.exports = { listar };
