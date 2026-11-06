import { peticion } from './cliente.js';

export const obtenerEstadisticas = () => peticion('/api/estadisticas', { auth: false });
