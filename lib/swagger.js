const swaggerJsdoc = require('swagger-jsdoc');

const respuesta = {
    type: 'object',
    properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string' },
        data: {}
    }
};

function operacion(summary, tag, opciones = {}) {
    const operation = {
        summary,
        tags: [tag],
        responses: Object.fromEntries((opciones.responses || [200, 400, 401, 404]).map((code) => [
            code,
            { description: code === 200 ? 'Operación exitosa' : 'Error de la solicitud', content: { 'application/json': { schema: respuesta } } }
        ]))
    };
    if (opciones.secure) operation.security = [{ bearerAuth: [] }];
    if (opciones.optionalSecure) operation.security = [{ bearerAuth: [] }, {}];
    if (opciones.params) operation.parameters = opciones.params.map((name) => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 }
    }));
    if (opciones.query) operation.parameters = (operation.parameters || []).concat(
        opciones.query.map((name) => {
            const schemas = {
                pagina: { type: 'integer', minimum: 1 },
                limite: { type: 'integer', minimum: 1, maximum: 50, description: 'Los valores superiores a 50 se limitan a 50.' },
                categoriaId: {
                    type: 'integer',
                    minimum: 1,
                    description: 'También acepta una cadena numérica de formulario, como "1".'
                },
                usuarioId: { type: 'integer', minimum: 1 },
                estado: { type: 'string', enum: ['pendiente', 'en_proceso', 'resuelto'] },
                orden: { type: 'string', enum: ['recientes', 'antiguos', 'mas_comentados', 'mas_apoyados'] },
                ubicacion: { type: 'string', description: 'Filtra por coincidencia parcial sin distinguir mayúsculas.' },
                q: { type: 'string' }
            };
            return { name, in: 'query', required: false, schema: schemas[name] || { type: 'string' } };
        })
    );
    if (opciones.body || opciones.optionalBody) {
        const campos = [...(opciones.body || []), ...(opciones.optionalBody || [])];
        operation.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        ...(opciones.body ? { required: opciones.body } : {}),
                        properties: Object.fromEntries(campos.map((field) => {
                            const schemas = {
                                nombre: { type: 'string', minLength: 1, maxLength: 100 },
                                correo: { type: 'string', format: 'email' },
                                password: {
                                    type: 'string',
                                    minLength: opciones.passwordMinLength || 8,
                                    ...(opciones.passwordMinLength === 1 ? {} : { maxLength: 72 })
                                },
                                passwordActual: { type: 'string', minLength: 1 },
                                passwordNueva: { type: 'string', minLength: 8, maxLength: 72 },
                                titulo: { type: 'string', minLength: 5, maxLength: 120 },
                                descripcion: { type: 'string', minLength: 10, maxLength: 1000 },
                                ubicacion: { type: 'string', maxLength: 100, nullable: true },
                                imagenUrl: { type: 'string', format: 'uri', nullable: true, description: 'URL HTTP o HTTPS.' },
                                contenido: { type: 'string', minLength: 1, maxLength: 500 },
                                categoriaId: { type: 'integer', minimum: 1 },
                                estado: { type: 'string', enum: ['pendiente', 'en_proceso', 'resuelto'] },
                                rol: { type: 'string', enum: ['estudiante', 'admin'] }
                            };
                            return [field, schemas[field] || { type: 'string' }];
                        }))
                    }
                }
            }
        };
    }
    return operation;
}

const paths = {
    '/': { get: operacion('Comprobar que la API está disponible', 'Sistema') },
    '/api/docs': { get: operacion('Abrir la documentación interactiva Swagger', 'Sistema') },
    '/api/salud': { get: operacion('Comprobar servidor y conexión con PostgreSQL', 'Sistema') },
    '/api/estadisticas': { get: operacion('Consultar estadísticas del foro', 'Estadísticas') },
    '/api/auth/registro': { post: operacion('Registrar un estudiante', 'Autenticación', { body: ['nombre', 'correo', 'password'], responses: [201, 400, 409] }) },
    '/api/auth/login': { post: operacion('Iniciar sesión y obtener JWT', 'Autenticación', { body: ['correo', 'password'], passwordMinLength: 1, responses: [200, 400, 401] }) },
    '/api/auth/perfil': {
        get: operacion('Consultar el perfil autenticado', 'Autenticación', { secure: true, responses: [200, 401, 404] }),
        put: operacion('Editar el nombre del perfil autenticado', 'Autenticación', { secure: true, body: ['nombre'], responses: [200, 400, 401] })
    },
    '/api/auth/password': { put: operacion('Cambiar la contraseña', 'Autenticación', { secure: true, body: ['passwordActual', 'passwordNueva'], responses: [200, 400, 401] }) },
    '/api/auth/mis-reportes': { get: operacion('Listar reportes propios con paginación', 'Autenticación', { secure: true, query: ['pagina', 'limite'] }) },
    '/api/categorias': {
        get: operacion('Listar categorías', 'Categorías'),
        post: operacion('Crear categoría (administrador)', 'Categorías', { secure: true, body: ['nombre'], responses: [201, 400, 401, 403, 409] })
    },
    '/api/categorias/{id}': {
        put: operacion('Editar categoría (administrador)', 'Categorías', { secure: true, params: ['id'], body: ['nombre'], responses: [200, 400, 401, 403, 404, 409] }),
        delete: operacion('Eliminar categoría sin reportes (administrador)', 'Categorías', { secure: true, params: ['id'], responses: [200, 401, 403, 404, 409] })
    },
    '/api/reportes': {
        get: operacion('Listar y filtrar reportes', 'Reportes', { optionalSecure: true, query: ['pagina', 'limite', 'categoriaId', 'estado', 'q', 'ubicacion', 'orden', 'usuarioId'] }),
        post: operacion('Crear reporte', 'Reportes', { secure: true, body: ['titulo', 'descripcion', 'categoriaId'], optionalBody: ['ubicacion', 'imagenUrl'], responses: [201, 400, 401] })
    },
    '/api/reportes/{id}': {
        get: operacion('Consultar reporte y comentarios', 'Reportes', { optionalSecure: true, params: ['id'], responses: [200, 400, 404] }),
        put: operacion('Editar reporte propio', 'Reportes', { secure: true, params: ['id'], body: ['titulo', 'descripcion'], optionalBody: ['ubicacion', 'imagenUrl'], responses: [200, 400, 401, 403, 404] }),
        delete: operacion('Eliminar reporte propio o moderar como administrador', 'Reportes', { secure: true, params: ['id'], responses: [200, 401, 403, 404] })
    },
    '/api/reportes/{id}/votos': {
        post: operacion('Registrar un voto (a mí también me pasa)', 'Votos', { secure: true, params: ['id'], responses: [201, 401, 404, 409] }),
        delete: operacion('Quitar el voto propio', 'Votos', { secure: true, params: ['id'], responses: [200, 401, 404] })
    },
    '/api/reportes/{id}/historial': {
        get: operacion('Consultar historial de cambios de estado', 'Reportes', { params: ['id'], responses: [200, 400, 404] })
    },
    '/api/reportes/{id}/estado': {
        patch: operacion('Cambiar estado (administrador o autor del reporte)', 'Reportes', { secure: true, params: ['id'], body: ['estado'], responses: [200, 400, 401, 403, 404] })
    },
    '/api/reportes/{id}/comentarios': {
        get: operacion('Listar comentarios paginados', 'Comentarios', { params: ['id'], query: ['pagina', 'limite'], responses: [200, 400, 404] }),
        post: operacion('Crear comentario', 'Comentarios', { secure: true, params: ['id'], body: ['contenido'], responses: [201, 400, 401, 404] })
    },
    '/api/comentarios/{id}': {
        put: operacion('Editar comentario propio', 'Comentarios', { secure: true, params: ['id'], body: ['contenido'], responses: [200, 400, 401, 403, 404] }),
        delete: operacion('Eliminar comentario propio o moderar como administrador', 'Comentarios', { secure: true, params: ['id'], responses: [200, 401, 403, 404] })
    },
    '/api/usuarios': { get: operacion('Listar usuarios sin correo ni passwordHash (administrador)', 'Usuarios', { secure: true, responses: [200, 401, 403] }) },
    '/api/usuarios/{id}/rol': {
        patch: operacion('Cambiar rol de usuario (administrador)', 'Usuarios', { secure: true, params: ['id'], body: ['rol'], responses: [200, 400, 401, 403, 404] })
    },
    '/api/usuarios/{id}/reportes': { get: operacion('Listar reportes de un usuario', 'Usuarios', { params: ['id'], query: ['pagina', 'limite'], responses: [200, 400, 404] }) }
};

module.exports = swaggerJsdoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Foro Universitario API',
            version: '1.0.0',
            description: 'API REST del Foro Universitario. Las rutas protegidas requieren un JWT Bearer.'
        },
        servers: [{ url: 'http://localhost:3000' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        paths
    },
    apis: []
});
