const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { obtenerRepositorios } = require('../repositories');
const { esDuplicado } = require('../repositories/errores');
const ErrorHttp = require('../utils/ErrorHttp');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

const repos = () => obtenerRepositorios();

async function registrar({ nombre, correo, password } = {}) {
    if (
        typeof nombre !== 'string' || !nombre.trim() ||
        typeof correo !== 'string' || !correo.trim() ||
        typeof password !== 'string' || password.length < 8 || password.length > 72
    ) {
        throw new ErrorHttp(400, 'Nombre, correo válido y una contraseña de 8 a 72 caracteres son obligatorios');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    try {
        return await repos().usuario.crear({
            nombre: nombre.trim(),
            correo: correo.trim().toLowerCase(),
            passwordHash,
            rol: 'estudiante'
        });
    } catch (error) {
        if (esDuplicado(error)) throw new ErrorHttp(409, 'El correo ya está registrado');
        throw error;
    }
}

async function iniciarSesion({ correo, password } = {}) {
    if (typeof correo !== 'string' || !correo.trim() || typeof password !== 'string' || !password) {
        throw new ErrorHttp(401, MENSAJE_CREDENCIALES_INVALIDAS);
    }

    const usuario = await repos().usuario.buscarPorCorreo(correo.trim().toLowerCase());
    if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
        throw new ErrorHttp(401, MENSAJE_CREDENCIALES_INVALIDAS);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (typeof jwtSecret !== 'string' || !jwtSecret.trim()) {
        // Error genérico: manejarErrores lo registra y responde 500.
        throw new Error('JWT_SECRET no está configurado en el entorno del servidor');
    }

    const token = jwt.sign(
        { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            creadoEn: usuario.creadoEn
        }
    };
}

async function obtenerPerfil(usuarioId) {
    const usuario = await repos().usuario.buscarPorId(usuarioId);
    if (!usuario) throw new ErrorHttp(404, 'Usuario no encontrado');
    return usuario;
}

function editarPerfil(usuarioId, { nombre }) {
    return repos().usuario.actualizarNombre(usuarioId, nombre);
}

async function cambiarPassword(usuarioId, { passwordActual, passwordNueva }) {
    const passwordHash = await repos().usuario.obtenerPasswordHash(usuarioId);
    if (!passwordHash || !(await bcrypt.compare(passwordActual, passwordHash))) {
        throw new ErrorHttp(400, 'La contraseña actual es incorrecta', {
            errores: { passwordActual: ['La contraseña actual es incorrecta'] }
        });
    }

    await repos().usuario.actualizarPasswordHash(usuarioId, await bcrypt.hash(passwordNueva, 10));
}

module.exports = { registrar, iniciarSesion, obtenerPerfil, editarPerfil, cambiarPassword };
