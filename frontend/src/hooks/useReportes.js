import { useCallback, useRef, useState } from 'react';
import { listarReportes } from '../api/reportes.js';

/**
 * loadReports del original. Los filtros viven en refs para que cada llamada lea
 * el valor vigente en ese instante (como las variables globales del script), y en
 * estado para poder pintar el botón/pastilla activos.
 *
 * lista.tipo: 'inicial' | 'cargando' | 'ok' | 'error' | 'conexion'
 */
export function useReportes() {
  const [lista, setLista] = useState({ tipo: 'inicial' });
  const [filtros, setFiltros] = useState({ orden: 'mas_apoyados', categoriaId: '', estado: '' });
  const filtrosRef = useRef({ orden: 'mas_apoyados', categoriaId: '', estado: '', q: '' });

  const loadReports = useCallback(async () => {
    setLista({ tipo: 'cargando' });
    try {
      const { json } = await listarReportes(filtrosRef.current);
      if (json.status === 'success') {
        setLista({ tipo: 'ok', reportes: json.data || [] });
      } else {
        setLista({ tipo: 'error', mensaje: json.message || 'Error al obtener reportes' });
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
      setLista({ tipo: 'conexion' });
    }
  }, []);

  // Actualiza un filtro (orden, categoriaId, estado o q). No recarga por sí solo.
  const setFiltro = useCallback((clave, valor) => {
    filtrosRef.current = { ...filtrosRef.current, [clave]: valor };
    if (clave !== 'q') setFiltros((f) => ({ ...f, [clave]: valor }));
  }, []);

  return { lista, filtros, setFiltro, loadReports };
}
