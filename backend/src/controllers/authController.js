const authService = require('../services/auth.service');
const reportesService = require('../services/reportes.service');
const { respuestaPaginada } = require('../utils/paginacion');

async function registro(req, res) {
    const usuario = await authService.registrar(req.body || {});
    // "usuario" en la raíz se conserva por compatibilidad con clientes anteriores.
    return res.status(201).json({ status: 'success', message: 'Usuario registrado', data: usuario, usuario });
}

async function login(req, res) {
    const { token, usuario } = await authService.iniciarSesion(req.body || {});
    // token y usuario se repiten en la raíz por compatibilidad.
    return res.json({
        status: 'success',
        message: 'Inicio de sesión exitoso',
        data: { token, usuario },
        token,
        usuario: { ...usuario }
    });
}

async function perfil(req, res) {
    const usuario = await authService.obtenerPerfil(req.usuario.id);
    return res.json({ status: 'success', message: 'Perfil obtenido', data: usuario, usuario });
}

async function editarPerfil(req, res) {
    const usuario = await authService.editarPerfil(req.usuario.id, req.body);
    return res.json({ status: 'success', message: 'Perfil actualizado', data: usuario });
}

async function cambiarPassword(req, res) {
    await authService.cambiarPassword(req.usuario.id, req.body);
    return res.json({ status: 'success', message: 'Contraseña actualizada', data: null });
}

async function misReportes(req, res) {
    const resultado = await reportesService.listar(req.query, {
        usuarioActualId: req.usuario.id,
        usuarioIdForzado: req.usuario.id
    });
    return res.json(respuestaPaginada('Reportes obtenidos', resultado, resultado.items));
}

module.exports = { registro, login, perfil, editarPerfil, cambiarPassword, misReportes };
