const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

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
app.get('/api/categorias', (req, res) => {
    const query = 'SELECT * FROM categorias';
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: err.message });
        }

        res.json({
            status: 'success',
            total: results.length,
            data: results
        });
    });
});n

// Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});