const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const esquemas = require('../controllers/esquemas');
const { obtenerLimite } = require('../controllers/validaciones');
const prisma = require('../lib/prisma');
const manejarErrores = require('../middleware/manejarErrores');
const verificarToken = require('../middleware/verificarToken');
const verificarTokenOpcional = require('../middleware/verificarTokenOpcional');
const reportesController = require('../controllers/reportesController');
const votosController = require('../controllers/votosController');
const usuariosController = require('../controllers/usuariosController');

function crearRespuesta() {
    return {
        statusCode: 200,
        body: null,
        status(codigo) {
            this.statusCode = codigo;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('valida campos opcionales, URL, rol y categoriaId de formulario', () => {
    const registro = esquemas.registro.safeParse({
        nombre: 'Ana',
        correo: ' Ana@Example.com ',
        password: 'ClaveSegura123'
    });
    assert.equal(registro.success, true);
    assert.equal(registro.data.correo, 'ana@example.com');
    assert.equal(esquemas.login.parse({
        correo: ' ANA@EXAMPLE.COM ',
        password: 'ClaveSegura123'
    }).correo, 'ana@example.com');

    assert.equal(esquemas.registro.safeParse({
        nombre: 'Ana',
        correo: 'ana@example.com',
        password: 'x'.repeat(73)
    }).success, false);
    assert.equal(esquemas.cambiarPassword.safeParse({
        passwordActual: 'ClaveSegura123',
        passwordNueva: 'x'.repeat(73)
    }).success, false);

    const reporte = esquemas.reporte.safeParse({
        titulo: 'Título válido',
        descripcion: 'Descripción suficientemente larga.',
        categoriaId: '1',
        ubicacion: ' A-101 ',
        imagenUrl: 'https://example.com/image.jpg'
    });
    assert.equal(reporte.success, true);
    assert.equal(reporte.data.categoriaId, 1);
    assert.equal(reporte.data.ubicacion, 'A-101');
    assert.equal(esquemas.reporte.safeParse({
        titulo: 'Título válido',
        descripcion: 'Descripción suficientemente larga.',
        categoriaId: '1',
        ubicacion: 'a'.repeat(101)
    }).success, false);
    assert.equal(esquemas.reporte.safeParse({
        titulo: 'Título válido',
        descripcion: 'Descripción suficientemente larga.',
        categoriaId: '1',
        imagenUrl: 'ftp://example.com/image.jpg'
    }).success, false);
    assert.equal(esquemas.reporte.safeParse({
        titulo: 'Título válido',
        descripcion: 'Descripción suficientemente larga.',
        categoriaId: '1',
        imagenUrl: 'not-a-url'
    }).success, false);
    assert.equal(esquemas.reporte.parse({
        titulo: 'Título válido',
        descripcion: 'Descripción suficientemente larga.',
        categoriaId: '1',
        ubicacion: '',
        imagenUrl: ''
    }).imagenUrl, null);
    assert.equal(esquemas.rol.safeParse({ rol: 'estudiante' }).success, true);
    assert.equal(esquemas.rol.safeParse({ rol: 'superadmin' }).success, false);
});

test('limita la paginación a 50 y rechaza valores no positivos', () => {
    assert.equal(obtenerLimite(undefined), 10);
    assert.equal(obtenerLimite('50'), 50);
    assert.equal(obtenerLimite('51'), 50);
    assert.equal(obtenerLimite('999999999999999999999'), 50);
    assert.equal(obtenerLimite('0'), null);
    assert.equal(obtenerLimite('abc'), null);
});

test('distingue JWT expirados, inválidos y falta de secreto', () => {
    const secretoAnterior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';
    const solicitudConToken = (token) => ({ get: () => `Bearer ${token}` });
    const tokenExpirado = jwt.sign(
        { id: 1, nombre: 'Ana', rol: 'estudiante' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', expiresIn: -1 }
    );
    const respuestaExpirada = crearRespuesta();
    verificarToken(solicitudConToken(tokenExpirado), respuestaExpirada, () => {
        assert.fail('Un token expirado no debe autenticarse');
    });
    assert.equal(respuestaExpirada.statusCode, 401);
    assert.equal(respuestaExpirada.body.message, 'Token expirado');
    assert.deepEqual(respuestaExpirada.body.data, { codigo: 'TOKEN_EXPIRADO' });

    const tokenConOtroAlgoritmo = jwt.sign(
        { id: 1, nombre: 'Ana', rol: 'estudiante' },
        process.env.JWT_SECRET,
        { algorithm: 'HS384' }
    );
    const respuestaInvalida = crearRespuesta();
    verificarToken(solicitudConToken(tokenConOtroAlgoritmo), respuestaInvalida, () => {
        assert.fail('Un token HS384 no debe autenticarse');
    });
    assert.equal(respuestaInvalida.statusCode, 401);
    assert.equal(respuestaInvalida.body.message, 'Token inválido');

    let errorRecibido;
    try {
        delete process.env.JWT_SECRET;
        verificarToken({ get: () => undefined }, crearRespuesta(), (error) => {
            errorRecibido = error;
        });
        assert.match(errorRecibido.message, /JWT_SECRET/);
    } finally {
        if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = secretoAnterior;
    }
});

test('el token opcional continúa sin token y reconoce un JWT válido', () => {
    const secretoAnterior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';
    try {
        let continuado = false;
        const reqSinToken = { get: () => undefined };
        verificarTokenOpcional(reqSinToken, {}, () => { continuado = true; });
        assert.equal(continuado, true);
        assert.equal(reqSinToken.usuario, undefined);

        const token = jwt.sign(
            { id: 4, nombre: 'Luis', rol: 'estudiante' },
            process.env.JWT_SECRET,
            { algorithm: 'HS256' }
        );
        const reqConToken = { get: () => `Bearer ${token}` };
        verificarTokenOpcional(reqConToken, {}, () => {});
        assert.deepEqual(reqConToken.usuario, { id: 4, nombre: 'Luis', rol: 'estudiante' });
    } finally {
        if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = secretoAnterior;
    }
});

test('maneja JSON mal formado y errores Prisma con el estado requerido', () => {
    const errorJson = new SyntaxError('detalle interno irrelevante');
    errorJson.status = 400;
    errorJson.body = '{';
    const respuestaJson = crearRespuesta();
    manejarErrores(errorJson, {}, respuestaJson, assert.fail);
    assert.equal(respuestaJson.statusCode, 400);
    assert.equal(respuestaJson.body.message, 'El cuerpo de la petición no es un JSON válido');

    for (const [codigo, estado] of [['P2002', 409], ['P2025', 404], ['P2003', 400]]) {
        const respuesta = crearRespuesta();
        manejarErrores({ code: codigo }, {}, respuesta, assert.fail);
        assert.equal(respuesta.statusCode, estado);
        assert.equal(respuesta.body.data, null);
    }
});

test('oculta los detalles de errores internos y los registra', () => {
    const respuesta = crearRespuesta();
    const error = new Error('detalle sensible');
    const errorOriginal = console.error;
    let registrado;
    console.error = (valor) => { registrado = valor; };
    try {
        manejarErrores(error, {}, respuesta, assert.fail);
    } finally {
        console.error = errorOriginal;
    }

    assert.equal(respuesta.statusCode, 500);
    assert.equal(respuesta.body.message, 'Error interno del servidor');
    assert.equal(respuesta.body.data, null);
    assert.equal(JSON.stringify(respuesta.body).includes('detalle sensible'), false);
    assert.equal(registrado, error);
});

test('solo autor o admin cambia estado y la actualización guarda historial', async () => {
    const transaccionOriginal = prisma.$transaction;
    let actualizaciones = 0;
    const cambios = [];
    const fecha = new Date('2026-01-01T00:00:00.000Z');
    const tx = {
        reporte: {
            findUnique: async () => ({ usuarioId: 7, estado: 'pendiente' }),
            update: async ({ data }) => {
                actualizaciones += 1;
                return {
                    id: 12,
                    titulo: 'Reporte completo',
                    descripcion: 'Descripción',
                    categoriaId: 3,
                    ubicacion: 'Aula',
                    imagenUrl: null,
                    categoria: { id: 3, nombre: 'Aulas' },
                    usuarioId: 7,
                    usuario: { nombre: 'Ana' },
                    estado: data.estado,
                    creadoEn: fecha,
                    actualizadoEn: fecha,
                    _count: { comentarios: 2, votos: 4 },
                    votos: [{ id: 1 }]
                };
            }
        },
        historialEstado: {
            create: async ({ data }) => { cambios.push(data); }
        }
    };
    prisma.$transaction = (callback) => callback(tx);

    try {
        const respuestaAjena = crearRespuesta();
        await reportesController.actualizarEstado({
            params: { id: '12' },
            body: { estado: 'resuelto' },
            usuario: { id: 8, rol: 'estudiante' }
        }, respuestaAjena, assert.fail);
        assert.equal(respuestaAjena.statusCode, 403);
        assert.equal(actualizaciones, 0);

        for (const usuario of [
            { id: 7, rol: 'estudiante' },
            { id: 8, rol: 'admin' }
        ]) {
            const respuesta = crearRespuesta();
            await reportesController.actualizarEstado({
                params: { id: '12' },
                body: { estado: 'resuelto' },
                usuario
            }, respuesta, assert.fail);
            assert.equal(respuesta.statusCode, 200);
            assert.deepEqual(respuesta.body.data, {
                id: 12,
                titulo: 'Reporte completo',
                descripcion: 'Descripción',
                categoriaId: 3,
                ubicacion: 'Aula',
                imagenUrl: null,
                categoria: { id: 3, nombre: 'Aulas' },
                usuarioId: 7,
                autor: 'Ana',
                estado: 'resuelto',
                creadoEn: fecha,
                actualizadoEn: fecha,
                totalComentarios: 2,
                totalVotos: 4,
                yaVote: true
            });
        }
        assert.equal(cambios.length, 2);
        assert.deepEqual(cambios[0], {
            reporteId: 12,
            usuarioId: 7,
            estadoAnterior: 'pendiente',
            estadoNuevo: 'resuelto'
        });
    } finally {
        prisma.$transaction = transaccionOriginal;
    }
});

test('filtra por ubicación, ordena por votos e informa yaVote', async () => {
    const transaccionOriginal = prisma.$transaction;
    const reporteOriginal = prisma.reporte;
    let filtro;
    let opcionesListado;
    const fecha = new Date('2026-01-01T00:00:00.000Z');
    prisma.reporte = {
        count: async ({ where }) => { filtro = where; return 1; },
        findMany: async (opciones) => {
            opcionesListado = opciones;
            return [{
                id: 12,
                titulo: 'Reporte',
                descripcion: 'Descripción',
                categoriaId: 3,
                ubicacion: 'Aula 101',
                imagenUrl: null,
                categoria: { id: 3, nombre: 'Aulas' },
                usuarioId: 7,
                usuario: { nombre: 'Ana' },
                estado: 'pendiente',
                creadoEn: fecha,
                actualizadoEn: fecha,
                _count: { comentarios: 2, votos: 4 },
                votos: [{ id: 9 }]
            }];
        }
    };
    prisma.$transaction = (operaciones) => Promise.all(operaciones);

    try {
        const respuesta = crearRespuesta();
        await reportesController.listar({
            query: { ubicacion: ' AULA ', orden: 'mas_apoyados' },
            usuario: { id: 4 }
        }, respuesta, assert.fail);
        assert.deepEqual(filtro.ubicacion, { contains: 'AULA', mode: 'insensitive' });
        assert.deepEqual(opcionesListado.orderBy[0], { votos: { _count: 'desc' } });
        assert.deepEqual(opcionesListado.include.votos, { where: { usuarioId: 4 }, select: { id: true } });
        assert.equal(respuesta.body.data[0].totalVotos, 4);
        assert.equal(respuesta.body.data[0].yaVote, true);
    } finally {
        prisma.$transaction = transaccionOriginal;
        prisma.reporte = reporteOriginal;
    }
});

test('lista el historial del reporte del más reciente al más antiguo', async () => {
    const reporteOriginal = prisma.reporte;
    const historialOriginal = prisma.historialEstado;
    let opcionesConsulta;
    prisma.reporte = { findUnique: async () => ({ id: 12 }) };
    prisma.historialEstado = {
        findMany: async (opciones) => {
            opcionesConsulta = opciones;
            return [{
                id: 20,
                reporteId: 12,
                usuarioId: 4,
                estadoAnterior: 'pendiente',
                estadoNuevo: 'en_proceso',
                creadoEn: new Date('2026-01-01T00:00:00.000Z'),
                usuario: { nombre: 'Ana' }
            }];
        }
    };

    try {
        const respuesta = crearRespuesta();
        await reportesController.historial({ params: { id: '12' } }, respuesta, assert.fail);
        assert.deepEqual(opcionesConsulta.orderBy, [{ creadoEn: 'desc' }, { id: 'desc' }]);
        assert.equal(respuesta.body.data[0].usuario, 'Ana');
        assert.equal(respuesta.body.data[0].estadoNuevo, 'en_proceso');
    } finally {
        prisma.reporte = reporteOriginal;
        prisma.historialEstado = historialOriginal;
    }
});

test('registra votos, rechaza duplicados y permite quitarlos', async () => {
    const reporteOriginal = prisma.reporte;
    const votoOriginal = prisma.voto;
    let existeReporte = true;
    let crearDuplicado = false;
    let borrado;
    prisma.reporte = {
        findUnique: async () => existeReporte ? { id: 12 } : null
    };
    prisma.voto = {
        create: async () => {
            if (crearDuplicado) {
                const error = new Error('unique');
                error.code = 'P2002';
                throw error;
            }
            return { reporteId: 12, usuarioId: 4, creadoEn: new Date('2026-01-01T00:00:00.000Z') };
        },
        deleteMany: async ({ where }) => { borrado = where; return { count: 1 }; }
    };

    try {
        const respuestaCreacion = crearRespuesta();
        await votosController.crear({ params: { id: '12' }, usuario: { id: 4 } }, respuestaCreacion, assert.fail);
        assert.equal(respuestaCreacion.statusCode, 201);

        crearDuplicado = true;
        const respuestaDuplicada = crearRespuesta();
        await votosController.crear({ params: { id: '12' }, usuario: { id: 4 } }, respuestaDuplicada, assert.fail);
        assert.equal(respuestaDuplicada.statusCode, 409);

        const respuestaEliminacion = crearRespuesta();
        await votosController.eliminar({ params: { id: '12' }, usuario: { id: 4 } }, respuestaEliminacion, assert.fail);
        assert.deepEqual(borrado, { reporteId: 12, usuarioId: 4 });
        assert.equal(respuestaEliminacion.body.status, 'success');

        existeReporte = false;
        const respuesta404 = crearRespuesta();
        await votosController.eliminar({ params: { id: '12' }, usuario: { id: 4 } }, respuesta404, assert.fail);
        assert.equal(respuesta404.statusCode, 404);
    } finally {
        prisma.reporte = reporteOriginal;
        prisma.voto = votoOriginal;
    }
});

test('admin cambia roles, pero no puede quitarse su propio rol', async () => {
    const usuarioOriginal = prisma.usuario;
    let actualizacion;
    prisma.usuario = {
        findUnique: async ({ where }) => where.id === 8 ? { id: 8 } : null,
        update: async ({ where, data }) => {
            actualizacion = { where, data };
            return { id: where.id, nombre: 'Luis', rol: data.rol, creadoEn: new Date() };
        }
    };

    try {
        const respuestaPropia = crearRespuesta();
        await usuariosController.cambiarRol({
            params: { id: '4' },
            body: { rol: 'estudiante' },
            usuario: { id: 4, rol: 'admin' }
        }, respuestaPropia, assert.fail);
        assert.equal(respuestaPropia.statusCode, 403);
        assert.equal(actualizacion, undefined);

        const respuesta = crearRespuesta();
        await usuariosController.cambiarRol({
            params: { id: '8' },
            body: { rol: 'admin' },
            usuario: { id: 4, rol: 'admin' }
        }, respuesta, assert.fail);
        assert.deepEqual(actualizacion, { where: { id: 8 }, data: { rol: 'admin' } });
        assert.equal(respuesta.body.data.rol, 'admin');
    } finally {
        prisma.usuario = usuarioOriginal;
    }
});
