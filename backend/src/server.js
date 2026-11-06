require('./config/env');

const app = require('./app');
const conexion = require('./database/conexion');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    await conexion.conectar();

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
            await conexion.desconectar();
        } catch (errorDesconexion) {
            console.error('❌ No se pudo cerrar la conexión de Prisma:', errorDesconexion);
        }
        process.exitCode = 1;
    });
}

iniciarServidor().catch(async (error) => {
    console.error('❌ Error al iniciar el servidor:', error);
    try {
        await conexion.desconectar();
    } catch (_) {}
    process.exitCode = 1;
});
