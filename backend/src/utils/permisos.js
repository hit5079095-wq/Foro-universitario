// Regla compartida: el autor del recurso o un administrador pueden modificarlo.
function esAutorOAdmin(usuarioIdRecurso, usuario) {
    return usuarioIdRecurso === usuario.id || usuario.rol === 'admin';
}

module.exports = { esAutorOAdmin };
