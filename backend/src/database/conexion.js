const { obtenerPrismaClient } = require('./prismaClient');

// "prisma" cuando hay conexión real; "memoria" usa los datos demo del store en memoria.
let modo = 'memoria';
let prisma = null;

async function conectar() {
    if (!process.env.DATABASE_URL) {
        modo = 'memoria';
        console.warn('⚠️ DATABASE_URL no está configurada; ejecutando en modo local con datos en memoria');
        return modo;
    }

    try {
        prisma = obtenerPrismaClient();
        await prisma.$connect();
        modo = 'prisma';
        console.log('✅ Conectado exitosamente a la base de datos mediante Prisma');
    } catch (error) {
        modo = 'memoria';
        console.warn('⚠️ Base de datos externa no disponible, ejecutando en modo local:', error.message);
    }
    return modo;
}

async function desconectar() {
    if (modo === 'prisma' && prisma) {
        await prisma.$disconnect();
    }
}

// Usado por GET /api/salud: lanza si la base de datos real no responde.
async function ping() {
    if (modo === 'prisma') {
        await prisma.$queryRaw`SELECT 1`;
    }
}

function obtenerModo() {
    return modo;
}

function obtenerPrisma() {
    return prisma;
}

module.exports = { conectar, desconectar, ping, obtenerModo, obtenerPrisma };
