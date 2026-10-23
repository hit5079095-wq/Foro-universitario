const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();
const verificarToken = require('./middleware/verificarToken');
const manejarErrores = require('./middleware/manejarErrores');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Configurar la conexión a tu MySQL local
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'foro_universitario'
});

// Probar que se conecte a la base de datos
db.connect((err) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado exitosamente a la base de datos MySQL');
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({ 
        status: 'success', 
        message: '¡Servidor base del Foro Universitario conectado a MySQL!' 
    });
});

// Endpoint de categorías consultando directo a MySQL
app.use('/api/categorias', verificarToken);

app.get('/api/categorias', async (req, res, next) => {
    try {
        const [results] = await db.promise().query('SELECT * FROM categorias');
        return res.json({ status: 'success', total: results.length, data: results });
    } catch (error) {
        return next(error);
    }
});

app.use('/api/auth', require('./routes/auth')(db));
app.use('/api/reportes', require('./routes/reportes')(db));
app.use('/api', require('./routes/comentarios')(db));

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});
app.use(manejarErrores);

// Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});