const conexion = require('../database/conexion');
const repositoriosMemoria = require('./memoria');
const crearRepositoriosPrisma = require('./prisma');

let repositoriosPrisma = null;
let clientePrisma = null;
let sustitutos = null;

function base() {
    if (conexion.obtenerModo() !== 'prisma') return repositoriosMemoria;
    const prisma = conexion.obtenerPrisma();
    if (!repositoriosPrisma || clientePrisma !== prisma) {
        repositoriosPrisma = crearRepositoriosPrisma(prisma);
        clientePrisma = prisma;
    }
    return repositoriosPrisma;
}

// Devuelve los repositorios activos (Prisma o memoria según la conexión, o los sustituidos en tests).
function obtenerRepositorios() {
    return sustitutos ? { ...base(), ...sustitutos } : base();
}

// Sustituye uno o varios repositorios (p. ej. dobles de prueba). Los no indicados siguen siendo los reales.
function usarRepositorios(repos) {
    sustitutos = { ...repos };
}

function restaurarRepositorios() {
    sustitutos = null;
}

module.exports = { obtenerRepositorios, usarRepositorios, restaurarRepositorios, repositoriosMemoria, crearRepositoriosPrisma };
