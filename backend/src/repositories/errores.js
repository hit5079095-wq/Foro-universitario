// Errores de dominio de los repositorios. Conservan los códigos de Prisma para que
// manejarErrores responda igual (P2002 -> 409, P2025 -> 404, P2003 -> 400).
function crearError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

const errorDuplicado = (message = 'Registro duplicado') => crearError('P2002', message);
const errorNoEncontrado = (message = 'Registro no encontrado') => crearError('P2025', message);

const esDuplicado = (error) => error?.code === 'P2002';
const esReferenciaInvalida = (error) => error?.code === 'P2003';

module.exports = { errorDuplicado, errorNoEncontrado, esDuplicado, esReferenciaInvalida };
