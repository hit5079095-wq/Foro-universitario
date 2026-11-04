const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificarToken = require('../middleware/verificarToken');

const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';
const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

module.exports = (prisma) => {
    const router = express.Router();

    router.post('/registro', async (req, res) => {
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

        const nombreNormalizado = nombre.trim();
        const correoNormalizado = correo.trim();

        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const usuario = await prisma.usuario.create({
                data: {
                    nombre: nombreNormalizado,
                    correo: correoNormalizado,
                    passwordHash
                },
                select: { id: true }
            });

            return res.status(201).json({
                status: 'success',
                message: 'Usuario registrado',
                data: {
                    id: usuario.id,
                    nombre: nombreNormalizado,
                    correo: correoNormalizado
                }
            });
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({
                    status: 'error',
                    message: 'El correo ya está registrado'
                });
            }

            console.error('Error al registrar usuario:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.post('/login', async (req, res) => {
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

            if (!usuario) {
                return res.status(401).json({
                    status: 'error',
                    message: MENSAJE_CREDENCIALES_INVALIDAS
                });
            }

            const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

            if (!passwordValida) {
                return res.status(401).json({
                    status: 'error',
                    message: MENSAJE_CREDENCIALES_INVALIDAS
                });
            }

            const token = jwt.sign(
                { id: usuario.id, nombre: usuario.nombre },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
            );

            return res.json({
                status: 'success',
                token,
                data: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo
                }
            });
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    router.get('/perfil', verificarToken, async (req, res) => {
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { id: Number(req.usuario.id) },
                select: { id: true, nombre: true, correo: true, creadoEn: true }
            });

            if (!usuario) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }

            return res.json({
                status: 'success',
                data: {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    correo: usuario.correo,
                    creado_en: usuario.creadoEn
                }
            });
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    return router;
};
