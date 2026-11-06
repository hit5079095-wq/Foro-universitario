require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const categorias = [
    'Mantenimiento de mesas y sillas',
    'Equipos de cómputo y redes',
    'Aulas e infraestructura',
    'Convivencia y servicios',
    'Cafetería y comidas',
    'Biblioteca',
    'Baños y limpieza',
    'Seguridad del campus'
];

const estudiantes = [
    { nombre: 'Ana Demo', correo: 'ana@foro.com', password: 'Estudiante123' },
    { nombre: 'Luis Demo', correo: 'luis@foro.com', password: 'Estudiante123' },
    { nombre: 'Sofía Demo', correo: 'sofia@foro.com', password: 'Estudiante123' }
];

const datosReportes = [
    { titulo: 'Proyector sin señal en aula 101', descripcion: 'El proyector del aula 101 no recibe señal al conectar una computadora.', categoria: 'Equipos de cómputo y redes', estudiante: 'ana@foro.com', estado: 'pendiente' },
    { titulo: 'Sillas dañadas en el salón B', descripcion: 'Hay varias sillas con tornillos flojos en el salón B y requieren mantenimiento.', categoria: 'Mantenimiento de mesas y sillas', estudiante: 'luis@foro.com', estado: 'en_proceso' },
    { titulo: 'Fuga de agua cerca de biblioteca', descripcion: 'Se observa una fuga de agua en el pasillo que conecta con la biblioteca.', categoria: 'Biblioteca', estudiante: 'sofia@foro.com', estado: 'resuelto' },
    { titulo: 'Luminaria fundida en aula 204', descripcion: 'Una de las luminarias del aula 204 está fundida y el espacio queda oscuro.', categoria: 'Aulas e infraestructura', estudiante: 'ana@foro.com', estado: 'pendiente' },
    { titulo: 'Limpieza pendiente en baños', descripcion: 'Los baños del edificio central necesitan limpieza y reposición de jabón.', categoria: 'Baños y limpieza', estudiante: 'luis@foro.com', estado: 'en_proceso' },
    { titulo: 'Red wifi inestable en cafetería', descripcion: 'La conexión wifi se interrumpe con frecuencia en la zona de cafetería.', categoria: 'Equipos de cómputo y redes', estudiante: 'sofia@foro.com', estado: 'pendiente' },
    { titulo: 'Mesa rota en laboratorio', descripcion: 'Una mesa de trabajo del laboratorio tiene una pata rota y no es segura.', categoria: 'Mantenimiento de mesas y sillas', estudiante: 'ana@foro.com', estado: 'resuelto' },
    { titulo: 'Contenedor lleno en patio', descripcion: 'El contenedor del patio norte está lleno y se requiere recolección.', categoria: 'Convivencia y servicios', estudiante: 'luis@foro.com', estado: 'pendiente' }
];

const textosComentarios = [
    'Gracias por reportarlo; vamos a dar seguimiento.',
    'Ya se compartió el caso con el área responsable.',
    '¿Podrían confirmar si el problema continúa?'
];

async function asegurarUsuario({ nombre, correo, password, rol }) {
    const existente = await prisma.usuario.findUnique({
        where: { correo },
        select: { passwordHash: true }
    });
    const passwordHash = existente && await bcrypt.compare(password, existente.passwordHash)
        ? existente.passwordHash
        : await bcrypt.hash(password, 10);

    return prisma.usuario.upsert({
        where: { correo },
        update: { nombre, rol, passwordHash },
        create: { nombre, correo, passwordHash, rol }
    });
}

async function main() {
    if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
        throw new Error('Configura ADMIN_PASSWORD con al menos 8 caracteres antes de ejecutar el seed');
    }

    const categoriasPorNombre = {};
    for (const nombre of categorias) {
        categoriasPorNombre[nombre] = await prisma.categoria.upsert({
            where: { nombre },
            update: {},
            create: { nombre }
        });
    }

    await asegurarUsuario({
        nombre: 'Administrador Demo',
        correo: 'admin@foro.com',
        password: process.env.ADMIN_PASSWORD,
        rol: 'admin'
    });

    const estudiantesPorCorreo = {};
    for (const estudiante of estudiantes) {
        estudiantesPorCorreo[estudiante.correo] = await asegurarUsuario({
            ...estudiante,
            rol: 'estudiante'
        });
    }

    for (const [indice, datos] of datosReportes.entries()) {
        const usuario = estudiantesPorCorreo[datos.estudiante];
        const existente = await prisma.reporte.findFirst({
            where: { titulo: datos.titulo, usuarioId: usuario.id },
            select: { id: true }
        });
        const contenido = {
            titulo: datos.titulo,
            descripcion: datos.descripcion,
            categoriaId: categoriasPorNombre[datos.categoria].id,
            usuarioId: usuario.id,
            estado: datos.estado
        };
        const reporte = existente
            ? await prisma.reporte.update({ where: { id: existente.id }, data: contenido })
            : await prisma.reporte.create({ data: contenido });

        const comentarista = estudiantesPorCorreo[estudiantes[(indice + 1) % estudiantes.length].correo];
        const texto = textosComentarios[indice % textosComentarios.length];
        const comentarioExistente = await prisma.comentario.findFirst({
            where: { reporteId: reporte.id, usuarioId: comentarista.id, contenido: texto },
            select: { id: true }
        });
        if (!comentarioExistente) {
            await prisma.comentario.create({
                data: { reporteId: reporte.id, usuarioId: comentarista.id, contenido: texto }
            });
        }
    }

    console.log('Seed completado: categorías, administrador, estudiantes, reportes y comentarios de demostración.');
}

main()
    .catch((error) => {
        console.error('Error al cargar los datos iniciales:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
