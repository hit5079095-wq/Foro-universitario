const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const esquemas = require('../controllers/esquemas');
const { obtenerLimite } = require('../controllers/validaciones');
const prisma = require('../lib/prisma');
const manejarErrores = require('../middleware/manejarErrores');
const verificarToken = require('../middleware/verificarToken');
const reportesController = require('../controllers/reportesController');

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

test('normaliza correos, acepta categoriaId de formulario y limita contraseñas', () => {
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
        categoriaId: '1'
    });
    assert.equal(reporte.success, true);
    assert.equal(reporte.data.categoriaId, 1);
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

test('solo el autor o admin cambia estado y recibe el reporte serializado', async () => {
    const propiedadOriginal = prisma.reporte;
    let updateInvocado = false;
    const fecha = new Date('2026-01-01T00:00:00.000Z');
    prisma.reporte = {
        findUnique: async () => ({ usuarioId: 7 }),
        update: async ({ data }) => {
            updateInvocado = true;
            assert.equal(data.estado, 'resuelto');
            return {
                id: 12,
                titulo: 'Reporte completo',
                descripcion: 'Descripción',
                categoriaId: 3,
                categoria: { id: 3, nombre: 'Aulas' },
                usuarioId: 7,
                usuario: { nombre: 'Ana' },
                estado: data.estado,
                creadoEn: fecha,
                _count: { comentarios: 2 }
            };
        }
    };

    try {
        const respuestaAjena = crearRespuesta();
        await reportesController.actualizarEstado({
            params: { id: '12' },
            body: { estado: 'resuelto' },
            usuario: { id: 8, rol: 'estudiante' }
        }, respuestaAjena, assert.fail);
        assert.equal(respuestaAjena.statusCode, 403);
        assert.equal(updateInvocado, false);

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
                categoria: { id: 3, nombre: 'Aulas' },
                usuarioId: 7,
                autor: 'Ana',
                estado: 'resuelto',
                creadoEn: fecha,
                totalComentarios: 2
            });
        }
    } finally {
        prisma.reporte = propiedadOriginal;
    }
});
