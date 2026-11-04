require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');
const manejarErrores = require('./middleware/manejarErrores');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        status: 'success', 
        message: '¡Servidor base del Foro Universitario conectado a Prisma!'
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/reportes', require('./routes/reportes'));
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