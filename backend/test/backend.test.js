const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const esquemas = require('../src/validators/esquemas');
const { obtenerLimite } = require('../src/utils/paginacion');
const manejarErrores = require('../src/middlewares/manejarErrores');
const verificarToken = require('../src/middlewares/verificarToken');
const verificarTokenOpcional = require('../src/middlewares/verificarTokenOpcional');
const reportesController = require('../src/controllers/reportesController');
const votosController = require('../src/controllers/votosController');
const usuariosController = require('../src/controllers/usuariosController');
const { usarRepositorios, restaurarRepositorios, repositoriosMemoria, crearRepositoriosPrisma } = require('../src/repositories');
const { reiniciarStore } = require('../src/database/memoria/store');
const ErrorHttp = require('../src/utils/ErrorHttp');

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

// Ejecuta un controlador como lo haría Express 5: los errores lanzados pasan por manejarErrores.
async function ejecutar(controlador, req) {
    const respuesta = crearRespuesta();
    try {
        await controlador(req, respuesta, assert.fail);
    } catch (error) {
        manejarErrores(error, req, respuesta, assert.fail);
    }
    return respuesta;
}

// Inyecta repositorios construidos sobre un PrismaClient falso y los restaura al terminar.
async function conPrismaFalso(prismaFalso, prueba) {
    usarRepositorios(crearRepositoriosPrisma(prismaFalso));
    try {
        await prueba();
    } finally {
        restaurarRepositorios();
    }
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

test('convierte ErrorHttp en la respuesta JSON estándar', () => {
    const respuesta = crearRespuesta();
    manejarErrores(new ErrorHttp(403, 'Prohibido', { motivo: 'x' }), {}, respuesta, assert.fail);
    assert.equal(respuesta.statusCode, 403);
    assert.deepEqual(respuesta.body, { status: 'error', message: 'Prohibido', data: { motivo: 'x' } });
});

test('solo autor o admin cambia estado y la actualización guarda historial', async () => {
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

    await conPrismaFalso({ $transaction: (callback) => callback(tx) }, async () => {
        const respuestaAjena = await ejecutar(reportesController.actualizarEstado, {
            params: { id: '12' },
            body: { estado: 'resuelto' },
            usuario: { id: 8, rol: 'estudiante' }
        });
        assert.equal(respuestaAjena.statusCode, 403);
        assert.equal(respuestaAjena.body.message, 'No puedes cambiar el estado de un reporte ajeno');
        assert.equal(actualizaciones, 0);

        for (const usuario of [
            { id: 7, rol: 'estudiante' },
            { id: 8, rol: 'admin' }
        ]) {
            const respuesta = await ejecutar(reportesController.actualizarEstado, {
                params: { id: '12' },
                body: { estado: 'resuelto' },
                usuario
            });
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
    });
});

test('filtra por ubicación, ordena por votos e informa yaVote', async () => {
    let filtro;
    let opcionesListado;
    const fecha = new Date('2026-01-01T00:00:00.000Z');
    const prismaFalso = {
        reporte: {
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
        },
        $transaction: (operaciones) => Promise.all(operaciones)
    };

    await conPrismaFalso(prismaFalso, async () => {
        const respuesta = await ejecutar(reportesController.listar, {
            query: { ubicacion: ' AULA ', orden: 'mas_apoyados' },
            usuario: { id: 4 }
        });
        assert.deepEqual(filtro.ubicacion, { contains: 'AULA', mode: 'insensitive' });
        assert.deepEqual(opcionesListado.orderBy[0], { votos: { _count: 'desc' } });
        assert.deepEqual(opcionesListado.include.votos, { where: { usuarioId: 4 }, select: { id: true } });
        assert.equal(respuesta.body.total, 1);
        assert.equal(respuesta.body.pagina, 1);
        assert.equal(respuesta.body.limite, 10);
        assert.equal(respuesta.body.totalPaginas, 1);
        assert.equal(respuesta.body.data[0].totalVotos, 4);
        assert.equal(respuesta.body.data[0].yaVote, true);
    });
});

test('lista el historial del reporte del más reciente al más antiguo', async () => {
    let opcionesConsulta;
    const prismaFalso = {
        reporte: { findUnique: async () => ({ id: 12 }) },
        historialEstado: {
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
        }
    };

    await conPrismaFalso(prismaFalso, async () => {
        const respuesta = await ejecutar(reportesController.historial, { params: { id: '12' } });
        assert.deepEqual(opcionesConsulta.orderBy, [{ creadoEn: 'desc' }, { id: 'desc' }]);
        assert.equal(respuesta.body.data[0].usuario, 'Ana');
        assert.equal(respuesta.body.data[0].estadoNuevo, 'en_proceso');
    });
});

test('registra votos, rechaza duplicados y permite quitarlos', async () => {
    let existeReporte = true;
    let crearDuplicado = false;
    let borrado;
    const prismaFalso = {
        reporte: {
            findUnique: async () => existeReporte ? { id: 12 } : null
        },
        voto: {
            create: async () => {
                if (crearDuplicado) {
                    const error = new Error('unique');
                    error.code = 'P2002';
                    throw error;
                }
                return { reporteId: 12, usuarioId: 4, creadoEn: new Date('2026-01-01T00:00:00.000Z') };
            },
            deleteMany: async ({ where }) => { borrado = where; return { count: 1 }; }
        }
    };

    await conPrismaFalso(prismaFalso, async () => {
        const req = { params: { id: '12' }, usuario: { id: 4 } };
        const respuestaCreacion = await ejecutar(votosController.crear, req);
        assert.equal(respuestaCreacion.statusCode, 201);

        crearDuplicado = true;
        const respuestaDuplicada = await ejecutar(votosController.crear, req);
        assert.equal(respuestaDuplicada.statusCode, 409);
        assert.equal(respuestaDuplicada.body.message, 'Ya votaste por este reporte');

        const respuestaEliminacion = await ejecutar(votosController.eliminar, req);
        assert.deepEqual(borrado, { reporteId: 12, usuarioId: 4 });
        assert.equal(respuestaEliminacion.body.status, 'success');

        existeReporte = false;
        const respuesta404 = await ejecutar(votosController.eliminar, req);
        assert.equal(respuesta404.statusCode, 404);
    });
});

test('admin cambia roles, pero no puede quitarse su propio rol', async () => {
    let actualizacion;
    const prismaFalso = {
        usuario: {
            findUnique: async ({ where }) => where.id === 8 ? { id: 8 } : null,
            update: async ({ where, data }) => {
                actualizacion = { where, data };
                return { id: where.id, nombre: 'Luis', rol: data.rol, creadoEn: new Date() };
            }
        }
    };

    await conPrismaFalso(prismaFalso, async () => {
        const respuestaPropia = await ejecutar(usuariosController.cambiarRol, {
            params: { id: '4' },
            body: { rol: 'estudiante' },
            usuario: { id: 4, rol: 'admin' }
        });
        assert.equal(respuestaPropia.statusCode, 403);
        assert.equal(actualizacion, undefined);

        const respuesta = await ejecutar(usuariosController.cambiarRol, {
            params: { id: '8' },
            body: { rol: 'admin' },
            usuario: { id: 4, rol: 'admin' }
        });
        assert.deepEqual(actualizacion, { where: { id: 8 }, data: { rol: 'admin' } });
        assert.equal(respuesta.body.data.rol, 'admin');
    });
});

test('los services usan repositorios inyectados sin Prisma', async () => {
    usarRepositorios({
        reporte: { existe: async () => false }
    });
    try {
        const respuesta = await ejecutar(reportesController.historial, { params: { id: '99' } });
        assert.equal(respuesta.statusCode, 404);
        assert.deepEqual(respuesta.body, { status: 'error', message: 'Reporte no encontrado', data: null });

        const invalido = await ejecutar(reportesController.historial, { params: { id: 'abc' } });
        assert.equal(invalido.statusCode, 400);
        assert.equal(invalido.body.message, 'El identificador del reporte no es válido');
    } finally {
        restaurarRepositorios();
    }
});

test('repositorio en memoria: filtros insensibles, paginación y orden mas_comentados', async () => {
    reiniciarStore();
    const { reporte, comentario } = repositoriosMemoria;

    const porUbicacion = await reporte.listar({ filtros: { ubicacion: 'AULA' } });
    assert.deepEqual(porUbicacion.items.map((r) => r.id), [4, 1]);
    assert.equal(porUbicacion.items[0].votos, undefined, 'sin usuario no se incluye votos (ni yaVote)');

    const porTexto = await reporte.listar({ filtros: { q: 'BIBLIOTECA' } });
    assert.deepEqual(porTexto.items.map((r) => r.id), [3]);

    const combinados = await reporte.listar({ filtros: { estado: 'resuelto', categoriaId: 1, usuarioId: 3 } });
    assert.deepEqual(combinados.items.map((r) => r.id), [2]);

    const paginado = await reporte.listar({ skip: 1, take: 2 });
    assert.equal(paginado.total, 4);
    assert.deepEqual(paginado.items.map((r) => r.id), [3, 2]);

    await comentario.crear({ reporteId: 4, usuarioId: 3, contenido: 'Uno' });
    await comentario.crear({ reporteId: 4, usuarioId: 4, contenido: 'Dos' });
    const comentados = await reporte.listar({ orden: 'mas_comentados' });
    assert.deepEqual(comentados.items.map((r) => r.id), [4, 2, 1, 3]);

    const apoyados = await reporte.listar({ orden: 'mas_apoyados', usuarioActualId: 3 });
    assert.deepEqual(apoyados.items.map((r) => r.id), [1, 2, 4, 3]);
    assert.deepEqual(apoyados.items[0].votos.length, 1);

    const antiguos = await reporte.listar({ orden: 'antiguos' });
    assert.deepEqual(antiguos.items.map((r) => r.id), [1, 2, 3, 4]);
});

test('repositorio en memoria: voto duplicado, categoría duplicada y borrado en cascada', async () => {
    reiniciarStore();
    const { voto, reporte, categoria, usuario, historialEstado } = repositoriosMemoria;

    await assert.rejects(voto.crear({ reporteId: 1, usuarioId: 3 }), { code: 'P2002' });
    const nuevo = await voto.crear({ reporteId: 4, usuarioId: 3 });
    assert.deepEqual(Object.keys(nuevo), ['reporteId', 'usuarioId', 'creadoEn']);

    assert.deepEqual(await categoria.buscarPorNombre('BIBLIOTECA'), { id: 6 });
    assert.equal(await categoria.buscarPorNombre('biblioteca', { excluirId: 6 }), null);
    await assert.rejects(usuario.crear({ nombre: 'X', correo: 'ANA@foro.com', passwordHash: 'h', rol: 'estudiante' }), { code: 'P2002' });

    const prohibido = await reporte.eliminarConComentarios({ id: 1, usuarioId: 3, rol: 'estudiante' });
    assert.equal(prohibido.tipo, 'prohibido');
    const eliminado = await reporte.eliminarConComentarios({ id: 1, usuarioId: 2, rol: 'estudiante' });
    assert.equal(eliminado.tipo, 'eliminado');
    assert.equal(await reporte.existe(1), false);
    assert.deepEqual(await historialEstado.listarPorReporte(1), []);
    assert.equal(await voto.eliminar({ reporteId: 1, usuarioId: 4 }), 0);
    const estadisticas = await repositoriosMemoria.estadisticas.obtener();
    assert.equal(estadisticas.totalComentarios, 1);
});

test('flujo HTTP completo con repositorios en memoria', async (t) => {
    const secretoAnterior = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'secreto-de-prueba-e2e';
    restaurarRepositorios();
    reiniciarStore();

    const app = require('../src/app');
    const servidor = app.listen(0);
    await new Promise((resolve) => servidor.once('listening', resolve));
    t.after(() => {
        servidor.close();
        if (secretoAnterior === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = secretoAnterior;
    });

    const base = `http://127.0.0.1:${servidor.address().port}`;
    const pedir = async (ruta, { metodo = 'GET', token, cuerpo } = {}) => {
        const respuesta = await fetch(base + ruta, {
            method: metodo,
            headers: {
                Accept: 'application/json',
                ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
        return { status: respuesta.status, body: await respuesta.json() };
    };

    const raiz = await pedir('/');
    assert.deepEqual(raiz.body, { status: 'success', message: '¡Servidor base del Foro Universitario conectado a Prisma!', data: null });

    const categorias = await pedir('/api/categorias');
    assert.equal(categorias.body.total, 8);

    const login = await pedir('/api/auth/login', {
        metodo: 'POST',
        cuerpo: { correo: 'ADMIN@foro.com', password: process.env.ADMIN_PASSWORD || 'Admin1234' }
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.token, login.body.data.token);
    assert.deepEqual(login.body.usuario, login.body.data.usuario);
    assert.equal(login.body.usuario.rol, 'admin');
    const token = login.body.token;

    const creado = await pedir('/api/reportes', {
        metodo: 'POST',
        token,
        cuerpo: { titulo: 'Puerta atascada', descripcion: 'La puerta del aula 305 no abre bien.', categoriaId: '3' }
    });
    assert.equal(creado.status, 201);
    assert.equal(creado.body.data.estado, 'pendiente');
    assert.equal(creado.body.data.ubicacion, null);
    assert.equal(creado.body.data.yaVote, false);
    const id = creado.body.data.id;

    const voto = await pedir(`/api/reportes/${id}/votos`, { metodo: 'POST', token });
    assert.equal(voto.status, 201);
    const duplicado = await pedir(`/api/reportes/${id}/votos`, { metodo: 'POST', token });
    assert.equal(duplicado.status, 409);
    assert.deepEqual(duplicado.body, { status: 'error', message: 'Ya votaste por este reporte', data: null });

    const estado = await pedir(`/api/reportes/${id}/estado`, { metodo: 'PATCH', token, cuerpo: { estado: 'en_proceso' } });
    assert.equal(estado.status, 200);
    assert.equal(estado.body.data.estado, 'en_proceso');
    assert.equal(estado.body.data.totalVotos, 1);
    assert.equal(estado.body.data.yaVote, true);

    const historial = await pedir(`/api/reportes/${id}/historial`);
    assert.equal(historial.status, 200);
    assert.equal(historial.body.data.length, 1);
    assert.equal(historial.body.data[0].estadoAnterior, 'pendiente');
    assert.equal(historial.body.data[0].estadoNuevo, 'en_proceso');
    assert.equal(historial.body.data[0].usuario, 'Administrador Demo');

    const listado = await pedir('/api/reportes?orden=mas_apoyados&limite=2');
    assert.equal(listado.body.total, 5);
    assert.equal(listado.body.totalPaginas, 3);
    assert.equal('yaVote' in listado.body.data[0], false);

    const noExiste = await pedir('/api/no-existe');
    assert.equal(noExiste.status, 404);
    assert.equal(noExiste.body.message, 'Ruta no encontrada');
});
