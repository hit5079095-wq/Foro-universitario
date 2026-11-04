const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const verificarToken = require('./middleware/verificarToken');
const manejarErrores = require('./middleware/manejarErrores');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        status: 'success', 
        message: '¡Servidor base del Foro Universitario conectado a Prisma!'
    });
});

app.use('/api/categorias', verificarToken);

app.get('/api/categorias', async (req, res, next) => {
    try {
        const results = await prisma.categoria.findMany();
        return res.json({ status: 'success', total: results.length, data: results });
    } catch (error) {
        return next(error);
    }
});

app.use('/api/auth', require('./routes/auth')(prisma));
app.use('/api/reportes', require('./routes/reportes')(prisma));
app.use('/api', require('./routes/comentarios')(prisma));

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