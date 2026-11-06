import { useCallback, useRef, useState } from 'react';
import { obtenerHistorial, obtenerReporte } from '../api/reportes.js';
import { obtenerToken } from '../api/cliente.js';

/**
 * openReportDetails del original. Al abrir se muestran "Cargando..." en cabecera y
 * comentarios; descripción, imagen, historial y contador conservan el valor previo
 * hasta que llega la respuesta (igual que al manipular el DOM).
 */
export function useDetalleReporte() {
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState({
    reporte: null, // null => "Cargando detalles..."
    descripcion: '',
    imagenUrl: '',
    historial: null, // null => vacío (aún no cargado nunca)
    comentarios: [], // null => "Cargando comentarios..."
    conteo: 0,
    puedeComentar: false, // se evalúa al abrir, como el original
  });
  const reporteIdRef = useRef(null);

  const openReportDetails = useCallback(async (reporteId) => {
    reporteIdRef.current = reporteId;
    setAbierto(true);
    setDetalle((d) => ({ ...d, reporte: null, comentarios: null, puedeComentar: Boolean(obtenerToken()) }));

    try {
      const [reportRes, histRes] = await Promise.all([obtenerReporte(reporteId), obtenerHistorial(reporteId)]);
      const reportJson = reportRes.json;
      const histJson = histRes.json;

      if (reportJson.status === 'success' && reportJson.data) {
        const r = reportJson.data;
        const comentarios = r.comentarios || [];
        setDetalle((d) => ({
          ...d,
          reporte: r,
          descripcion: r.descripcion,
          imagenUrl: r.imagenUrl || '',
          historial: histJson.status === 'success' && histJson.data && histJson.data.length > 0 ? histJson.data : [],
          comentarios,
          conteo: comentarios.length,
        }));
      }
    } catch (err) {
      console.error('Error abriendo detalles:', err);
    }
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  return { abierto, detalle, reporteIdRef, openReportDetails, cerrar };
}
