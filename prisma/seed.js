const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categorias = [
    { id: 1, nombre: 'Mantenimiento de mesas y sillas' },
    { id: 2, nombre: 'Equipos de cómputo y redes' },
    { id: 3, nombre: 'Aulas e infraestructura' },
    { id: 4, nombre: 'Convivencia y servicios' },
    { id: 5, nombre: 'Cafeteria y comidas' }
];

async function main() {
    for (const categoria of categorias) {
        await prisma.categoria.upsert({
            where: { id: categoria.id },
            update: { nombre: categoria.nombre },
            create: categoria
        });
    }
}

main()
    .catch((error) => {
        console.error('Error al cargar las categorías iniciales:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
