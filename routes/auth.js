const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verificarToken = require('../middleware/verificarToken');

const MENSAJE_ERROR_INTERNO = 'Error interno del servidor';
const MENSAJE_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

module.exports = (db) => {
    const router = express.Router();
    const connection = db.promise();

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
            const [usuariosExistentes] = await connection.query(
                'SELECT id FROM usuarios WHERE correo = ? LIMIT 1',
                [correoNormalizado]
            );

            if (usuariosExistentes.length > 0) {
                return res.status(409).json({
                    status: 'error',
                    message: 'El correo ya está registrado'
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const [resultado] = await connection.query(
                'INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)',
                [nombreNormalizado, correoNormalizado, passwordHash]
            );

            return res.status(201).json({
                status: 'success',
                message: 'Usuario registrado',
                data: {
                    id: resultado.insertId,
                    nombre: nombreNormalizado,
                    correo: correoNormalizado
                }
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
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
            const [usuarios] = await connection.query(
                'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = ? LIMIT 1',
                [correo.trim()]
            );

            if (usuarios.length === 0) {
                return res.status(401).json({
                    status: 'error',
                    message: MENSAJE_CREDENCIALES_INVALIDAS
                });
            }

            const usuario = usuarios[0];
            const passwordValida = await bcrypt.compare(password, usuario.password_hash);

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
            const [usuarios] = await connection.query(
                'SELECT id, nombre, correo, creado_en FROM usuarios WHERE id = ? LIMIT 1',
                [req.usuario.id]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado'
                });
            }

            return res.json({ status: 'success', data: usuarios[0] });
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return res.status(500).json({ status: 'error', message: MENSAJE_ERROR_INTERNO });
        }
    });

    return router;
};
