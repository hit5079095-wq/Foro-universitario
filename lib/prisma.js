const bcrypt = require('bcryptjs');

let realPrisma = null;
let isConnectedToRealDb = false;

if (process.env.DATABASE_URL) {
    try {
        const { PrismaClient } = require('@prisma/client');
        realPrisma = new PrismaClient();
    } catch (e) {
        console.warn('[AI Studio] No se pudo instanciar PrismaClient:', e.message);
    }
}

// Almacenamiento en memoria para desarrollo local
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234';
const defaultAdminHash = bcrypt.hashSync(adminPassword, 10);
const defaultStudentHash = bcrypt.hashSync('Estudiante123', 10);

const store = {
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
        {
            id: 1,
            nombre: 'Administrador Demo',
            correo: 'admin@foro.com',
            passwordHash: defaultAdminHash,
            rol: 'admin',
            creadoEn: new Date('2026-01-01T08:00:00Z')
        },
        {
            id: 2,
            nombre: 'Ana Demo',
            correo: 'ana@foro.com',
            passwordHash: defaultStudentHash,
            rol: 'estudiante',
            creadoEn: new Date('2026-01-02T08:00:00Z')
        },
        {
            id: 3,
            nombre: 'Luis Demo',
            correo: 'luis@foro.com',
            passwordHash: defaultStudentHash,
            rol: 'estudiante',
            creadoEn: new Date('2026-01-03T08:00:00Z')
        },
        {
            id: 4,
            nombre: 'Sofía Demo',
            correo: 'sofia@foro.com',
            passwordHash: defaultStudentHash,
            rol: 'estudiante',
            creadoEn: new Date('2026-01-04T08:00:00Z')
        }
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
        {
            id: 1,
            reporteId: 1,
            usuarioId: 3,
            contenido: 'Gracias por reportarlo; vamos a dar seguimiento.',
            creadoEn: new Date('2026-01-05T10:00:00Z')
        },
        {
            id: 2,
            reporteId: 2,
            usuarioId: 4,
            contenido: 'Ya se compartió el caso con el área responsable.',
            creadoEn: new Date('2026-01-06T11:00:00Z')
        }
    ],
    votos: [
        { id: 1, reporteId: 1, usuarioId: 3, creadoEn: new Date('2026-01-05T10:30:00Z') },
        { id: 2, reporteId: 1, usuarioId: 4, creadoEn: new Date('2026-01-05T10:35:00Z') },
        { id: 3, reporteId: 2, usuarioId: 2, creadoEn: new Date('2026-01-06T11:30:00Z') }
    ],
    historialEstados: [
        {
            id: 1,
            reporteId: 1,
            usuarioId: 1,
            estadoAnterior: 'pendiente',
            estadoNuevo: 'en_proceso',
            creadoEn: new Date('2026-01-05T10:00:00Z')
        },
        {
            id: 2,
            reporteId: 2,
            usuarioId: 1,
            estadoAnterior: 'en_proceso',
            estadoNuevo: 'resuelto',
            creadoEn: new Date('2026-01-06T12:00:00Z')
        }
    ]
};

let nextId = {
    categoria: 9,
    usuario: 5,
    reporte: 5,
    comentario: 3,
    voto: 4,
    historialEstado: 3
};

function aplicarSelect(item, select) {
    if (!select || !item) return item;
    const resultado = {};
    for (const key of Object.keys(select)) {
        if (select[key] && key in item) {
            resultado[key] = item[key];
        }
    }
    return resultado;
}

const mockCategoria = {
    async findMany(opciones = {}) {
        let resultado = store.categorias.map(c => {
            const reportesCount = store.reportes.filter(r => r.categoriaId === c.id).length;
            const item = { ...c };
            if (opciones.select?._count) {
                item._count = { reportes: reportesCount };
            }
            return item;
        });
        if (opciones.select) {
            resultado = resultado.map(c => aplicarSelect(c, opciones.select));
        }
        return resultado;
    },
    async findFirst({ where = {}, select } = {}) {
        const item = store.categorias.find(c => {
            if (where.nombre) {
                const nombreBuscado = where.nombre.equals || where.nombre;
                const modeInsensitive = where.nombre.mode === 'insensitive';
                const coincideNombre = modeInsensitive
                    ? c.nombre.toLowerCase() === nombreBuscado.toLowerCase()
                    : c.nombre === nombreBuscado;
                if (!coincideNombre) return false;
            }
            if (where.id && where.id.not && c.id === where.id.not) return false;
            return true;
        });
        return item ? aplicarSelect(item, select) : null;
    },
    async findUnique({ where = {}, select } = {}) {
        const item = store.categorias.find(c => {
            if (where.id !== undefined && c.id === where.id) return true;
            if (where.nombre !== undefined && c.nombre === where.nombre) return true;
            return false;
        });
        if (!item) return null;
        const reportesCount = store.reportes.filter(r => r.categoriaId === item.id).length;
        const conCount = { ...item, _count: { reportes: reportesCount } };
        return select ? aplicarSelect(conCount, select) : conCount;
    },
    async create({ data }) {
        const id = nextId.categoria++;
        const nueva = { id, ...data };
        store.categorias.push(nueva);
        return nueva;
    },
    async update({ where, data }) {
        const item = store.categorias.find(c => c.id === where.id);
        if (!item) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        Object.assign(item, data);
        return item;
    },
    async delete({ where }) {
        const index = store.categorias.findIndex(c => c.id === where.id);
        if (index === -1) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        const [removida] = store.categorias.splice(index, 1);
        return removida;
    },
    async upsert({ where, update, create }) {
        const existente = await this.findFirst({ where });
        if (existente) {
            return this.update({ where: { id: existente.id }, data: update });
        }
        return this.create({ data: create });
    }
};

const mockUsuario = {
    async findUnique({ where = {}, select } = {}) {
        const item = store.usuarios.find(u => {
            if (where.id !== undefined && u.id === where.id) return true;
            if (where.correo !== undefined && u.correo.toLowerCase() === where.correo.toLowerCase()) return true;
            return false;
        });
        return item ? aplicarSelect(item, select) : null;
    },
    async findFirst({ where = {}, select } = {}) {
        const item = store.usuarios.find(u => {
            if (where.correo && u.correo.toLowerCase() !== where.correo.toLowerCase()) return false;
            if (where.id !== undefined && u.id !== where.id) return false;
            return true;
        });
        return item ? aplicarSelect(item, select) : null;
    },
    async findMany(opciones = {}) {
        let items = [...store.usuarios];
        if (opciones.select) {
            items = items.map(u => aplicarSelect(u, opciones.select));
        }
        return items;
    },
    async create({ data, select }) {
        const existe = store.usuarios.find(u => u.correo.toLowerCase() === data.correo.toLowerCase());
        if (existe) {
            const err = new Error('Unique constraint failed on the fields: (`correo`)');
            err.code = 'P2002';
            throw err;
        }
        const id = nextId.usuario++;
        const nuevo = { id, creadoEn: new Date(), ...data };
        store.usuarios.push(nuevo);
        return select ? aplicarSelect(nuevo, select) : nuevo;
    },
    async update({ where, data, select }) {
        const item = store.usuarios.find(u => u.id === where.id);
        if (!item) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        Object.assign(item, data);
        return select ? aplicarSelect(item, select) : item;
    },
    async count() {
        return store.usuarios.length;
    },
    async upsert({ where, update, create }) {
        const existente = await this.findUnique({ where });
        if (existente) {
            return this.update({ where: { id: existente.id }, data: update });
        }
        return this.create({ data: create });
    }
};

const mockReporte = {
    async count({ where = {} } = {}) {
        return (await this._filtrar(where)).length;
    },
    async _filtrar(where = {}) {
        return store.reportes.filter(r => {
            if (where.categoriaId !== undefined && r.categoriaId !== where.categoriaId) return false;
            if (where.estado !== undefined && r.estado !== where.estado) return false;
            if (where.usuarioId !== undefined && r.usuarioId !== where.usuarioId) return false;
            if (where.ubicacion) {
                const val = where.ubicacion.contains || where.ubicacion;
                if (!r.ubicacion || !r.ubicacion.toLowerCase().includes(val.toLowerCase())) return false;
            }
            if (where.OR) {
                const matchOr = where.OR.some(cond => {
                    if (cond.titulo && r.titulo.toLowerCase().includes(cond.titulo.contains.toLowerCase())) return true;
                    if (cond.descripcion && r.descripcion.toLowerCase().includes(cond.descripcion.contains.toLowerCase())) return true;
                    return false;
                });
                if (!matchOr) return false;
            }
            return true;
        });
    },
    async findMany(opciones = {}) {
        let filtrados = await this._filtrar(opciones.where || {});

        const enriquecidos = filtrados.map(r => {
            const categoria = store.categorias.find(c => c.id === r.categoriaId) || { id: r.categoriaId, nombre: 'General' };
            const usuario = store.usuarios.find(u => u.id === r.usuarioId) || { nombre: 'Usuario' };
            const comentariosCount = store.comentarios.filter(c => c.reporteId === r.id).length;
            const votos = store.votos.filter(v => v.reporteId === r.id);
            const votosCount = votos.length;

            const res = {
                ...r,
                categoria,
                usuario,
                _count: { comentarios: comentariosCount, votos: votosCount },
                votos: opciones.include?.votos?.where?.usuarioId
                    ? votos.filter(v => v.usuarioId === opciones.include.votos.where.usuarioId).map(v => ({ id: v.id }))
                    : votos.map(v => ({ id: v.id }))
            };
            return res;
        });

        // Ordenamiento
        if (opciones.orderBy) {
            const orderList = Array.isArray(opciones.orderBy) ? opciones.orderBy : [opciones.orderBy];
            enriquecidos.sort((a, b) => {
                for (const ord of orderList) {
                    if (ord.votos?._count) {
                        const diff = ord.votos._count === 'desc'
                            ? b._count.votos - a._count.votos
                            : a._count.votos - b._count.votos;
                        if (diff !== 0) return diff;
                    }
                    if (ord.creadoEn) {
                        const diff = ord.creadoEn === 'desc'
                            ? new Date(b.creadoEn) - new Date(a.creadoEn)
                            : new Date(a.creadoEn) - new Date(b.creadoEn);
                        if (diff !== 0) return diff;
                    }
                }
                return 0;
            });
        }

        const skip = opciones.skip || 0;
        const take = opciones.take !== undefined ? opciones.take : enriquecidos.length;
        return enriquecidos.slice(skip, skip + take);
    },
    async findUnique({ where = {}, include, select } = {}) {
        const item = store.reportes.find(r => r.id === where.id);
        if (!item) return null;
        if (select) return aplicarSelect(item, select);

        const categoria = store.categorias.find(c => c.id === item.categoriaId) || { id: item.categoriaId, nombre: 'General' };
        const usuario = store.usuarios.find(u => u.id === item.usuarioId) || { nombre: 'Usuario' };
        const comentarios = store.comentarios.filter(c => c.reporteId === item.id).map(c => {
            const autor = store.usuarios.find(u => u.id === c.usuarioId) || { nombre: 'Usuario' };
            return { ...c, usuario: autor };
        });
        const votos = store.votos.filter(v => v.reporteId === item.id);

        return {
            ...item,
            categoria,
            usuario,
            comentarios,
            _count: { comentarios: comentarios.length, votos: votos.length },
            votos: include?.votos?.where?.usuarioId
                ? votos.filter(v => v.usuarioId === include.votos.where.usuarioId).map(v => ({ id: v.id }))
                : votos.map(v => ({ id: v.id }))
        };
    },
    async findFirst({ where = {}, select } = {}) {
        const filtrados = await this._filtrar(where);
        return filtrados.length > 0 ? (select ? aplicarSelect(filtrados[0], select) : filtrados[0]) : null;
    },
    async create({ data, select, include }) {
        const id = nextId.reporte++;
        const nuevo = {
            id,
            ubicacion: null,
            imagenUrl: null,
            ...data,
            creadoEn: new Date(),
            actualizadoEn: new Date()
        };
        store.reportes.push(nuevo);
        if (select) return aplicarSelect(nuevo, select);
        return this.findUnique({ where: { id }, include });
    },
    async update({ where, data, select, include }) {
        const item = store.reportes.find(r => r.id === where.id);
        if (!item) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        Object.assign(item, data, { actualizadoEn: new Date() });
        if (select) return aplicarSelect(item, select);
        return this.findUnique({ where: { id: item.id }, include });
    },
    async delete({ where }) {
        const index = store.reportes.findIndex(r => r.id === where.id);
        if (index === -1) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        const [removido] = store.reportes.splice(index, 1);
        return removido;
    },
    async groupBy({ by }) {
        if (by.includes('estado')) {
            const counts = {};
            for (const r of store.reportes) {
                counts[r.estado] = (counts[r.estado] || 0) + 1;
            }
            return Object.entries(counts).map(([estado, count]) => ({
                estado,
                _count: { _all: count }
            }));
        }
        return [];
    }
};

const mockComentario = {
    async count({ where = {} } = {}) {
        return store.comentarios.filter(c => where.reporteId ? c.reporteId === where.reporteId : true).length;
    },
    async findMany({ where = {}, skip = 0, take = 50 } = {}) {
        const filtrados = store.comentarios
            .filter(c => where.reporteId ? c.reporteId === where.reporteId : true)
            .map(c => ({
                ...c,
                usuario: store.usuarios.find(u => u.id === c.usuarioId) || { nombre: 'Usuario' }
            }));
        return filtrados.slice(skip, skip + take);
    },
    async findUnique({ where = {} } = {}) {
        return store.comentarios.find(c => c.id === where.id) || null;
    },
    async findFirst({ where = {}, select } = {}) {
        const item = store.comentarios.find(c => {
            if (where.reporteId && c.reporteId !== where.reporteId) return false;
            if (where.usuarioId && c.usuarioId !== where.usuarioId) return false;
            if (where.contenido && c.contenido !== where.contenido) return false;
            return true;
        });
        return item ? (select ? aplicarSelect(item, select) : item) : null;
    },
    async create({ data, select }) {
        const id = nextId.comentario++;
        const nuevo = { id, creadoEn: new Date(), ...data };
        store.comentarios.push(nuevo);
        const conUsuario = {
            ...nuevo,
            usuario: store.usuarios.find(u => u.id === nuevo.usuarioId) || { nombre: 'Usuario' }
        };
        return select ? aplicarSelect(conUsuario, select) : conUsuario;
    },
    async update({ where, data, select }) {
        const item = store.comentarios.find(c => c.id === where.id);
        if (!item) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        Object.assign(item, data);
        const conUsuario = {
            ...item,
            usuario: store.usuarios.find(u => u.id === item.usuarioId) || { nombre: 'Usuario' }
        };
        return select ? aplicarSelect(conUsuario, select) : conUsuario;
    },
    async delete({ where }) {
        const index = store.comentarios.findIndex(c => c.id === where.id);
        if (index === -1) {
            const err = new Error('Record not found');
            err.code = 'P2025';
            throw err;
        }
        const [removido] = store.comentarios.splice(index, 1);
        return removido;
    }
};

const mockVoto = {
    async create({ data, select }) {
        const existe = store.votos.find(v => v.reporteId === data.reporteId && v.usuarioId === data.usuarioId);
        if (existe) {
            const err = new Error('Unique constraint failed on the fields: (`reporteId`, `usuarioId`)');
            err.code = 'P2002';
            throw err;
        }
        const id = nextId.voto++;
        const nuevo = { id, creadoEn: new Date(), ...data };
        store.votos.push(nuevo);
        return select ? aplicarSelect(nuevo, select) : nuevo;
    },
    async deleteMany({ where }) {
        let count = 0;
        store.votos = store.votos.filter(v => {
            if (v.reporteId === where.reporteId && v.usuarioId === where.usuarioId) {
                count++;
                return false;
            }
            return true;
        });
        return { count };
    },
    async upsert({ where, create }) {
        const key = where.reporteId_usuarioId || where;
        const existe = store.votos.find(v => v.reporteId === key.reporteId && v.usuarioId === key.usuarioId);
        if (existe) return existe;
        return this.create({ data: create });
    }
};

const mockHistorialEstado = {
    async findMany({ where = {}, orderBy } = {}) {
        let items = store.historialEstados
            .filter(h => where.reporteId ? h.reporteId === where.reporteId : true)
            .map(h => ({
                ...h,
                usuario: store.usuarios.find(u => u.id === h.usuarioId)?.nombre || 'Usuario'
            }));
        if (orderBy) {
            items.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
        }
        return items;
    },
    async findFirst({ where = {}, select } = {}) {
        const item = store.historialEstados.find(h => {
            if (where.reporteId && h.reporteId !== where.reporteId) return false;
            if (where.usuarioId && h.usuarioId !== where.usuarioId) return false;
            if (where.estadoAnterior && h.estadoAnterior !== where.estadoAnterior) return false;
            if (where.estadoNuevo && h.estadoNuevo !== where.estadoNuevo) return false;
            return true;
        });
        return item ? (select ? aplicarSelect(item, select) : item) : null;
    },
    async create({ data }) {
        const id = nextId.historialEstado++;
        const nuevo = { id, creadoEn: new Date(), ...data };
        store.historialEstados.push(nuevo);
        return nuevo;
    }
};

const defaultNoOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d) => d?.data ?? {},
    update: async (d) => d?.data ?? {},
    delete: async () => ({}),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
    groupBy: async () => [],
    upsert: async (d) => d?.create ?? {}
};

const prismaMockTarget = {
    categoria: mockCategoria,
    usuario: mockUsuario,
    reporte: mockReporte,
    comentario: mockComentario,
    voto: mockVoto,
    historialEstado: mockHistorialEstado,

    async $connect() {
        if (realPrisma) {
            try {
                await realPrisma.$connect();
                isConnectedToRealDb = true;
                return;
            } catch (err) {
                console.warn('[AI Studio] Falló conexión a PostgreSQL mediante Prisma:', err.message);
                console.warn('[AI Studio] Utilizando base de datos simulada en memoria.');
                isConnectedToRealDb = false;
            }
        }
    },
    async $disconnect() {
        if (realPrisma && isConnectedToRealDb) {
            try {
                await realPrisma.$disconnect();
            } catch (_) {}
        }
    },
    async $queryRaw() {
        if (realPrisma && isConnectedToRealDb) {
            return realPrisma.$queryRaw.apply(realPrisma, arguments);
        }
        return [{ '?column?': 1 }];
    },
    async $transaction(arg) {
        if (realPrisma && isConnectedToRealDb) {
            return realPrisma.$transaction(arg);
        }
        if (typeof arg === 'function') {
            return arg(this);
        }
        if (Array.isArray(arg)) {
            return Promise.all(arg);
        }
        return arg;
    }
};

// Proxy para delegar a realPrisma si está conectado, o a prismaMockTarget en memoria
const prisma = new Proxy(prismaMockTarget, {
    get(target, prop) {
        if (prop in target) {
            return target[prop];
        }
        if (realPrisma && isConnectedToRealDb && prop in realPrisma) {
            return typeof realPrisma[prop] === 'function'
                ? realPrisma[prop].bind(realPrisma)
                : realPrisma[prop];
        }
        return defaultNoOp;
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    }
});

module.exports = prisma;
