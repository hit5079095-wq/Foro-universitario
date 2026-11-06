require('./config/env');

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const conexion = require('./database/conexion');
const rutasApi = require('./routes');
const manejarErrores = require('./middlewares/manejarErrores');

// Build del frontend (opcional): backend/src -> ../../frontend/dist
const DIRECTORIO_FRONTEND = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const INDEX_FRONTEND = path.join(DIRECTORIO_FRONTEND, 'index.html');

const MENSAJE_RAIZ = {
    status: 'success',
    message: '¡Servidor base del Foro Universitario conectado a Prisma!',
    data: null
};

function crearApp() {
    const app = express();
    app.set('trust proxy', 1);

    const origenesPermitidos = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
        .split(',')
        .map((origen) => origen.trim())
        .filter(Boolean);
    const limiteGeneral = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { status: 'error', message: 'Demasiadas solicitudes; intenta de nuevo más tarde', data: null }
    });
    const limiteAuth = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        skipSuccessfulRequests: true,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { status: 'error', message: 'Demasiados intentos; intenta de nuevo más tarde', data: null }
    });

    app.use(helmet({ frameguard: false, contentSecurityPolicy: false }));
    app.use(cors({ origin: origenesPermitidos }));
    app.use(limiteGeneral);
    app.use(express.json());

    // index: false para que GET / siga respondiendo JSON a clientes que aceptan JSON.
    app.use(express.static(DIRECTORIO_FRONTEND, { index: false }));

    // Negociación de contenido: los navegadores (Accept: text/html,...,*/*) reciben la SPA;
    // clientes API (Accept: application/json o */*) reciben el JSON de bienvenida.
    app.get('/', (req, res) => {
        if (req.accepts(['json', 'html']) === 'html' && fs.existsSync(INDEX_FRONTEND)) {
            return res.sendFile(INDEX_FRONTEND);
        }
        return res.json(MENSAJE_RAIZ);
    });

    app.get('/api/salud', async (req, res) => {
        await conexion.ping();
        return res.json({
            status: 'success',
            message: 'Servidor y base de datos activos',
            data: { servidor: 'activo', baseDeDatos: 'activa' }
        });
    });

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use('/api/auth/registro', limiteAuth);
    app.use('/api/auth/login', limiteAuth);
    app.use('/api', rutasApi);

    // Fallback SPA: rutas del frontend (no /api) que aceptan HTML reciben index.html.
    app.use((req, res, next) => {
        if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api') ||
            !req.accepts('html') || !fs.existsSync(INDEX_FRONTEND)) {
            return next();
        }
        return res.sendFile(INDEX_FRONTEND);
    });

    app.use((req, res) => {
        res.status(404).json({ status: 'error', message: 'Ruta no encontrada', data: null });
    });
    app.use(manejarErrores);

    return app;
}

module.exports = crearApp();
module.exports.crearApp = crearApp;
