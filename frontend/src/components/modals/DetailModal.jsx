import { useState } from 'react';
import { useToast } from '../../hooks/useToast.jsx';
import { obtenerToken } from '../../api/cliente.js';
import { agregarComentario } from '../../api/reportes.js';
import { formatDate, getStatusBadge } from '../../utils/formato.js';

// MODAL: DETALLES DE INCONFORMIDAD & COMENTARIOS
export default function DetailModal({ detalleHook, onRequiereAuth, onComentado }) {
  const showToast = useToast();
  const { abierto, detalle, reporteIdRef, openReportDetails, cerrar } = detalleHook;
  const [comentario, setComentario] = useState('');

  async function handleAddComment(e) {
    e.preventDefault();
    const reporteId = reporteIdRef.current;
    if (!obtenerToken() || !reporteId) return;

    const contenido = comentario.trim();
    if (!contenido) return;

    try {
      const { json } = await agregarComentario(reporteId, contenido);
      if (json.status === 'success') {
        setComentario('');
        showToast('Comentario agregado', 'success');
        openReportDetails(reporteId); // recarga comentarios
        onComentado(); // actualiza el contador del listado
      } else {
        showToast(json.message || 'Error al comentar', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  }

  return (
    <div id="detailModal" className={`fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop${abierto ? '' : ' hidden'}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* Detail Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50">
          <div id="detailHeader">
            <Cabecera reporte={detalle.reporte} />
          </div>
          <button id="closeDetailModal" onClick={cerrar} className="text-slate-400 hover:text-slate-700 text-lg p-1">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Detail Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descripción del problema</h4>
            <p id="detailDescription" className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{detalle.descripcion}</p>
          </div>

          {/* Optional Image */}
          <div id="detailImageContainer" className={detalle.imagenUrl ? undefined : 'hidden'}>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Foto de evidencia</h4>
            <img id="detailImage" src={detalle.imagenUrl || undefined} alt="Evidencia" className="max-h-72 w-full object-cover rounded-xl border border-slate-200" />
          </div>

          {/* Status Change History */}
          <div id="detailHistoryContainer">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Historial de Seguimiento Institucional</h4>
            <div id="detailHistoryList" className="space-y-2 text-xs">
              <Historial historial={detalle.historial} />
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="fa-solid fa-comments text-iush-teal"></i>
              <span>Comentarios de la Comunidad (<span id="detailCommentsCount">{detalle.conteo}</span>)</span>
            </h4>

            <div id="detailCommentsList" className="space-y-3 mb-4">
              <Comentarios comentarios={detalle.comentarios} />
            </div>

            {/* Add Comment Form */}
            <form id="formAddComment" onSubmit={handleAddComment} className="space-y-2">
              <div id="commentAuthPrompt" className={`${detalle.puedeComentar ? 'hidden ' : ''}text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200`}>
                Debes <button type="button" onClick={onRequiereAuth} className="font-bold underline">iniciar sesión</button> para comentar.
              </div>
              <div id="commentInputArea" className={detalle.puedeComentar ? undefined : 'hidden'}>
                <textarea
                  id="commentText"
                  rows={2}
                  required
                  maxLength={500}
                  placeholder="Escribe un comentario constructivo o aporta más detalles sobre esta inconformidad..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-iush-teal focus:outline-none"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                ></textarea>
                <div className="flex justify-end">
                  <button type="submit" className="bg-iush-navy hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                    <i className="fa-solid fa-reply"></i>
                    <span>Comentar</span>
                  </button>
                </div>
              </div>
            </form>

          </div>

        </div>

      </div>
    </div>
  );
}

function Cabecera({ reporte: r }) {
  if (!r) return <span className="text-xs text-slate-400">Cargando detalles...</span>;
  const status = getStatusBadge(r.estado);
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-iush-purple">{r.categoria?.nombre || ''}</span>
        <span className="text-slate-300">·</span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${status.class}`}>
          <i className={status.icon}></i> {status.label}
        </span>
      </div>
      <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl">{r.titulo}</h3>
      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
        <span>Reportado por <strong>{r.autor || 'Estudiante'}</strong></span>
        <span>·</span>
        <span>{formatDate(r.creadoEn)}</span>
        {r.ubicacion && (
          <>
            <span>·</span>
            <span>📍 {r.ubicacion}</span>
          </>
        )}
        <span>·</span>
        <span className="font-bold text-iush-teal"><i className="fa-solid fa-arrow-up"></i> {r.totalVotos || 0} apoyos</span>
      </div>
    </>
  );
}

function Historial({ historial }) {
  if (historial === null) return null;
  if (historial.length === 0) {
    return <p className="text-slate-400 italic text-[11px]">No hay cambios de estado registrados aún.</p>;
  }
  return historial.map((h, i) => (
    <div key={h.id ?? i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
      <div>
        <span className="font-semibold text-slate-800">{h.usuario}</span>
        <span className="text-slate-500"> cambió de </span>
        <span className="underline decoration-slate-300">{h.estadoAnterior}</span>
        <span className="text-slate-500"> a </span>
        <strong className="text-iush-navy">{h.estadoNuevo}</strong>
      </div>
      <span className="text-[10px] text-slate-400">{formatDate(h.creadoEn)}</span>
    </div>
  ));
}

function Comentarios({ comentarios }) {
  if (comentarios === null) {
    return <div className="p-4 text-center text-slate-400 text-xs">Cargando comentarios...</div>;
  }
  if (comentarios.length === 0) {
    return <p className="text-slate-400 italic text-xs py-2">No hay comentarios todavía. ¡Sé el primero en aportar!</p>;
  }
  return comentarios.map((c, i) => (
    <div key={c.id ?? i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <strong className="text-slate-800">{c.autor || 'Estudiante'}</strong>
        <span className="text-slate-400">{formatDate(c.creadoEn)}</span>
      </div>
      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{c.contenido}</p>
    </div>
  ));
}
