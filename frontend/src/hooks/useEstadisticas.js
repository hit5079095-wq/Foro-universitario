import { useCallback, useState } from 'react';
import { obtenerEstadisticas } from '../api/estadisticas.js';

// loadStatistics del original. `metricas` es null mientras no hay datos ('--').
export function useEstadisticas() {
  const [metricas, setMetricas] = useState(null);

  const loadStatistics = useCallback(async () => {
    try {
      const { json } = await obtenerEstadisticas();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        const resueltos = d.porEstado?.find((e) => e.estado === 'resuelto')?.cantidad || 0;
        const proceso = d.porEstado?.find((e) => e.estado === 'en_proceso')?.cantidad || 0;
        let totalVotos = 0;
        if (Array.isArray(d.reportesRecientes)) {
          totalVotos = d.reportesRecientes.reduce((acc, r) => acc + (r.totalVotos || 0), 0);
        }
        setMetricas({ total: d.totalReportes ?? 0, resueltos, proceso, votos: totalVotos });
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  return { metricas, loadStatistics };
}
