const bcrypt = require('bcryptjs');

// Datos demo para desarrollo local sin base de datos. Se crean al primer uso.
let hashes = null;
let estado = null;

function obtenerHashes() {
    if (!hashes) {
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
        hashes = {
            admin: bcrypt.hashSync(adminPassword, 10),
            estudiante: bcrypt.hashSync('Estudiante123', 10)
        };
    }
    return hashes;
}

function crearDatosDemo() {
    const { admin, estudiante } = obtenerHashes();
    return {
        categorias: [
            { id: 1, nombre: 'Mantenimiento de mesas y sillas' },
            { id: 2, nombre: 'Equipos de cómputo y redes' },
            { id: 3, nombre: 'Aulas e infraestructura' },
            { id: 4, nombre: 'Convivencia y servicios' },
            { id: 5, nombre: 'Cafetería y comidas' },
            { id: 6, nombre: 'Biblioteca' },
            { id: 7, nombre: 'Baños y limpieza' },
            { id: 8, nombre: 'Seguridad del campus' }
        ],
        usuarios: [
            { id: 1, nombre: 'Administrador Demo', correo: 'admin@foro.com', passwordHash: admin, rol: 'admin', creadoEn: new Date('2026-01-01T08:00:00Z') },
            { id: 2, nombre: 'Ana Demo', correo: 'ana@foro.com', passwordHash: estudiante, rol: 'estudiante', creadoEn: new Date('2026-01-02T08:00:00Z') },
            { id: 3, nombre: 'Luis Demo', correo: 'luis@foro.com', passwordHash: estudiante, rol: 'estudiante', creadoEn: new Date('2026-01-03T08:00:00Z') },
            { id: 4, nombre: 'Sofía Demo', correo: 'sofia@foro.com', passwordHash: estudiante, rol: 'estudiante', creadoEn: new Date('2026-01-04T08:00:00Z') }
        ],
        reportes: [
            {
                id: 1,
                titulo: 'Proyector sin señal en aula 101',
                descripcion: 'El proyector del aula 101 no recibe señal al conectar una computadora.',
                categoriaId: 2,
                usuarioId: 2,
                estado: 'en_proceso',
                ubicacion: 'Edificio A, aula 101',
                imagenUrl: null,
                creadoEn: new Date('2026-01-05T09:00:00Z'),
                actualizadoEn: new Date('2026-01-05T09:00:00Z')
            },
            {
                id: 2,
                titulo: 'Sillas dañadas en el salón B',
                descripcion: 'Hay varias sillas con tornillos flojos en el salón B y requieren mantenimiento.',
                categoriaId: 1,
                usuarioId: 3,
                estado: 'resuelto',
                ubicacion: 'Edificio B, salón B',
                imagenUrl: null,
                creadoEn: new Date('2026-01-06T10:00:00Z'),
                actualizadoEn: new Date('2026-01-06T10:00:00Z')
            },
            {
                id: 3,
                titulo: 'Fuga de agua cerca de biblioteca',
                descripcion: 'Se observa una fuga de agua en el pasillo que conecta con la biblioteca.',
                categoriaId: 6,
                usuarioId: 4,
                estado: 'resuelto',
                ubicacion: 'Pasillo de biblioteca',
                imagenUrl: null,
                creadoEn: new Date('2026-01-07T11:00:00Z'),
                actualizadoEn: new Date('2026-01-07T11:00:00Z')
            },
            {
                id: 4,
                titulo: 'Luminaria fundida en aula 204',
                descripcion: 'Una de las luminarias del aula 204 está fundida y el espacio queda oscuro.',
                categoriaId: 3,
                usuarioId: 2,
                estado: 'pendiente',
                ubicacion: 'Edificio A, aula 204',
                imagenUrl: null,
                creadoEn: new Date('2026-01-08T12:00:00Z'),
                actualizadoEn: new Date('2026-01-08T12:00:00Z')
            }
        ],
        comentarios: [
            { id: 1, reporteId: 1, usuarioId: 3, contenido: 'Gracias por reportarlo; vamos a dar seguimiento.', creadoEn: new Date('2026-01-05T10:00:00Z') },
            { id: 2, reporteId: 2, usuarioId: 4, contenido: 'Ya se compartió el caso con el área responsable.', creadoEn: new Date('2026-01-06T11:00:00Z') }
        ],
        votos: [
            { id: 1, reporteId: 1, usuarioId: 3, creadoEn: new Date('2026-01-05T10:30:00Z') },
            { id: 2, reporteId: 1, usuarioId: 4, creadoEn: new Date('2026-01-05T10:35:00Z') },
            { id: 3, reporteId: 2, usuarioId: 2, creadoEn: new Date('2026-01-06T11:30:00Z') }
        ],
        historialEstados: [
            { id: 1, reporteId: 1, usuarioId: 1, estadoAnterior: 'pendiente', estadoNuevo: 'en_proceso', creadoEn: new Date('2026-01-05T10:00:00Z') },
            { id: 2, reporteId: 2, usuarioId: 1, estadoAnterior: 'en_proceso', estadoNuevo: 'resuelto', creadoEn: new Date('2026-01-06T12:00:00Z') }
        ],
        nextId: {
            categoria: 9,
            usuario: 5,
            reporte: 5,
            comentario: 3,
            voto: 4,
            historialEstado: 3
        }
    };
}

function obtenerStore() {
    if (!estado) estado = crearDatosDemo();
    return estado;
}

// Restaura los datos demo (útil en tests).
function reiniciarStore() {
    estado = crearDatosDemo();
    return estado;
}

function siguienteId(entidad) {
    const store = obtenerStore();
    return store.nextId[entidad]++;
}

module.exports = { obtenerStore, reiniciarStore, siguienteId };
