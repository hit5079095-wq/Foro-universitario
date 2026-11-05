const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const reportesController = require('./reportesController');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

async function registro(req, res, next) {
    const { nombre, correo, password } = req.body || {};

    if (
        typeof nombre !== 'string' || !nombre.trim() ||
        typeof correo !== 'string' || !correo.trim() ||
        typeof password !== 'string' || password.length < 8
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre, correo válido y una contraseña de al menos 8 caracteres son obligatorios'
        });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = await prisma.usuario.create({
            data: {
                nombre: nombre.trim(),
                correo: correo.trim(),
                passwordHash,
                rol: 'estudiante'
            },
            select: { id: true, nombre: true, correo: true, rol: true, creadoEn: true }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Usuario registrado',
            data: usuario,
            usuario
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'El correo ya está registrado'
            });
        }

        return next(error);
    }
}

async function login(req, res, next) {
    const { correo, password } = req.body || {};

    if (typeof correo !== 'string' || !correo.trim() ||
        typeof password !== 'string' || !password) {
        return res.status(401).json({
            status: 'error',
            message: MENSAJE_CREDENCIALES_INVALIDAS
        });
    }

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { correo: correo.trim() }
        });

        if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
            return res.status(401).json({
                status: 'error',
                message: MENSAJE_CREDENCIALES_INVALIDAS
            });
        }

        const jwtSecret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

        if (typeof jwtSecret !== 'string' || !jwtSecret.trim()) {
            return next(new Error('JWT_SECRET no está configurado en el entorno del servidor'));
        }

        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
            jwtSecret,
            { expiresIn }
        );

        return res.json({
            status: 'success',
            message: 'Inicio de sesión exitoso',
            data: {
                token,
                usuario: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    rol: usuario.rol,
                    creadoEn: usuario.creadoEn
                }
            },
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol,
                creadoEn: usuario.creadoEn
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function perfil(req, res, next) {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.usuario.id },
            select: { id: true, nombre: true, correo: true, rol: true, creadoEn: true }
        });

        if (!usuario) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        return res.json({ status: 'success', message: 'Perfil obtenido', data: usuario, usuario });
    } catch (error) {
        return next(error);
    }
}

async function editarPerfil(req, res, next) {
    try {
        const usuario = await prisma.usuario.update({
            where: { id: req.usuario.id },
            data: { nombre: req.body.nombre },
            select: { id: true, nombre: true, correo: true, rol: true, creadoEn: true }
        });

        return res.json({
            status: 'success',
            message: 'Perfil actualizado',
            data: usuario
        });
    } catch (error) {
        return next(error);
    }
}

async function cambiarPassword(req, res, next) {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: req.usuario.id },
            select: { passwordHash: true }
        });

        if (!usuario || !(await bcrypt.compare(req.body.passwordActual, usuario.passwordHash))) {
            return res.status(400).json({
                status: 'error',
                message: 'La contraseña actual es incorrecta',
                data: { errores: { passwordActual: ['La contraseña actual es incorrecta'] } }
            });
        }

        const passwordHash = await bcrypt.hash(req.body.passwordNueva, 10);
        await prisma.usuario.update({
            where: { id: req.usuario.id },
            data: { passwordHash }
        });

        return res.json({ status: 'success', message: 'Contraseña actualizada', data: null });
    } catch (error) {
        return next(error);
    }
}

function misReportes(req, res, next) {
    return reportesController.listarPorUsuario(req, res, next, req.usuario.id);
}

module.exports = { registro, login, perfil, editarPerfil, cambiarPassword, misReportes };
