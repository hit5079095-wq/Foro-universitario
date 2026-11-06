import { peticion } from './cliente.js';

export const iniciarSesion = (correo, password) =>
  peticion('/api/auth/login', { method: 'POST', body: { correo, password }, auth: false });

export const registrarUsuario = (nombre, correo, password) =>
  peticion('/api/auth/registro', { method: 'POST', body: { nombre, correo, password }, auth: false });
