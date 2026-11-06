let cliente = null;

// Instancia perezosa de PrismaClient (solo se crea si hay DATABASE_URL y se intenta conectar).
function obtenerPrismaClient() {
    if (!cliente) {
        const { PrismaClient } = require('@prisma/client');
        cliente = new PrismaClient();
    }
    return cliente;
}

module.exports = { obtenerPrismaClient };
