import { peticion } from './cliente.js';

export const obtenerCategorias = () => peticion('/api/categorias', { auth: false });
