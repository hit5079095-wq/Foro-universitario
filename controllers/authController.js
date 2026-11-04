const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

async function registro(req, res, next) {
    const { nombre, correo, password } = req.body || {};

    if (
        typeof nombre !== 'string' || !nombre.trim() ||
        typeof correo !== 'string' || !correo.trim() ||
        typeof password !== 'string' || password.length < 6
    ) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre, correo y una contraseña de al menos 6 caracteres son obligatorios'
        });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = await prisma.usuario.create({
            data: {
                nombre: nombre.trim(),
                correo: correo.trim(),
                passwordHash
            },
            select: { id: true, nombre: true, correo: true, creadoEn: true }
        });

        return res.status(201).json({
            status: 'success',
            message: 'Usuario registrado',
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
            { id: usuario.id, nombre: usuario.nombre },
            jwtSecret,
            { expiresIn }
        );

        return res.json({
            status: 'success',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
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
            select: { id: true, nombre: true, correo: true, creadoEn: true }
        });

        if (!usuario) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        return res.json({ status: 'success', usuario });
    } catch (error) {
        return next(error);
    }
}

module.exports = { registro, login, perfil };
