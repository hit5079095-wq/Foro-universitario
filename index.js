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
const PORT = process.env.PORT || 3000;

const origenesPermitidos = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
const limiteGeneral = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { status: 'error', message: 'Demasiadas solicitudes; intenta de nuevo más tarde' }
});
const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { status: 'error', message: 'Demasiados intentos; intenta de nuevo más tarde' }
});

app.use(helmet());
app.use(cors({ origin: origenesPermitidos }));
app.use(limiteGeneral);
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
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
    res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});
app.use(manejarErrores);

async function iniciarServidor() {
    await prisma.$connect();
    console.log('✅ Conectado exitosamente a la base de datos mediante Prisma');

    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

iniciarServidor().catch(async (error) => {
    console.error('❌ Error al conectar a la base de datos mediante Prisma:', error);
    await prisma.$disconnect();
    process.exitCode = 1;
});