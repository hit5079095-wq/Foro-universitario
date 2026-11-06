import { peticion } from './cliente.js';

export function listarReportes({ orden, categoriaId, estado, q }) {
  const params = new URLSearchParams({ limite: '50', orden });
  if (categoriaId) params.append('categoriaId', categoriaId);
  if (estado) params.append('estado', estado);
  if (q.trim()) params.append('q', q.trim());
  return peticion(`/api/reportes?${params.toString()}`);
}

export const obtenerReporte = (id) => peticion(`/api/reportes/${id}`);

export const obtenerHistorial = (id) => peticion(`/api/reportes/${id}/historial`, { auth: false });

export const crearReporte = (datos) => peticion('/api/reportes', { method: 'POST', body: datos });

export const votar = (id) => peticion(`/api/reportes/${id}/votos`, { method: 'POST' });

export const quitarVoto = (id) => peticion(`/api/reportes/${id}/votos`, { method: 'DELETE' });

export const cambiarEstado = (id, estado) =>
  peticion(`/api/reportes/${id}/estado`, { method: 'PATCH', body: { estado } });

export const agregarComentario = (id, contenido) =>
  peticion(`/api/reportes/${id}/comentarios`, { method: 'POST', body: { contenido } });
