import { useCallback, useState } from 'react';
import { obtenerCategorias } from '../api/categorias.js';

// loadCategories del original. `categorias` es null hasta la primera carga exitosa
// (mientras tanto la barra de categorías muestra su marcado inicial).
export function useCategorias() {
  const [categorias, setCategorias] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const { json } = await obtenerCategorias();
      if (json.status === 'success' && Array.isArray(json.data)) {
        setCategorias(json.data);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  }, []);

  return { categorias, loadCategories };
}
