require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const prisma = require('./lib/prisma');
const manejarErrores = require('./middleware/manejarErrores');
const swaggerDocument = require('./lib/swagger');

const app = express();
const PORT = 3000;
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

app.use(helmet({
    frameguard: false,
    contentSecurityPolicy: false
}));
app.use(cors({ origin: origenesPermitidos }));
app.use(limiteGeneral);
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    if (req.accepts('html') && !req.accepts('json')) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    res.json({ 
        status: 'success', 
        message: '¡Servidor base del Foro Universitario conectado a Prisma!',
        data: null
    });
});

app.get('/api/salud', async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.json({
            status: 'success',
            message: 'Servidor y base de datos activos',
            data: { servidor: 'activo', baseDeDatos: 'activa' }
        });
    } catch (error) {
        return next(error);
    }
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth/registro', limiteAuth);
app.use('/api/auth/login', limiteAuth);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/estadisticas', require('./routes/estadisticas'));
app.use('/api', require('./routes/comentarios'));

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Ruta no encontrada', data: null });
});
app.use(manejarErrores);

async function iniciarServidor() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado exitosamente a la base de datos mediante Prisma');
    } catch (error) {
        console.warn('⚠️ Base de datos externa no disponible, ejecutando en modo local:', error.message);
    }

    const servidor = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });
    servidor.on('error', async (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ El puerto ${PORT} ya está ocupado. Cierra el proceso que lo usa o configura otro valor en PORT.`);
        } else {
            console.error(`❌ No se pudo iniciar el servidor en el puerto ${PORT}:`, error);
        }
        try {
            await prisma.$disconnect();
        } catch (disconnectError) {
            console.error('❌ No se pudo cerrar la conexión de Prisma:', disconnectError);
        }
        process.exitCode = 1;
    });
}

iniciarServidor().catch(async (error) => {
    console.error('❌ Error al iniciar el servidor:', error);
    try {
        await prisma.$disconnect();
    } catch (_) {}
    process.exitCode = 1;
});