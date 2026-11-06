import { useState } from 'react';
import { useToast } from '../../hooks/useToast.jsx';
import { obtenerToken } from '../../api/cliente.js';
import { crearReporte } from '../../api/reportes.js';

const CAMPO = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-iush-teal focus:outline-none';
const VACIO = { titulo: '', categoriaId: '', ubicacion: '', descripcion: '', imagenUrl: '' };

// MODAL: NUEVA INCONFORMIDAD. `apertura` cambia en cada openNewReportModal y
// remonta el formulario, lo que equivale a formNewReport.reset() + ocultar el error.
export default function NewReportModal({ abierto, apertura, categorias, onCerrar, onRequiereAuth, onPublicado }) {
  return (
    <div id="newReportModal" className={`fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop${abierto ? '' : ' hidden'}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        <div className="bg-gradient-to-r from-iush-navy to-iush-teal p-6 text-white relative">
          <button id="closeReportModal" onClick={onCerrar} className="absolute right-4 top-4 text-slate-300 hover:text-white text-lg">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <span className="text-[10px] font-bold tracking-widest text-sky-200 uppercase">Salazar y Herrera</span>
          <h2 className="font-display text-xl font-bold mt-1">Registrar Nueva Inconformidad</h2>
          <p className="text-xs text-sky-100 mt-1">Publica una falla de infraestructura, equipo o servicio para que la comunidad la respalde</p>
        </div>

        <FormularioReporte
          key={apertura}
          categorias={categorias}
          onCerrar={onCerrar}
          onRequiereAuth={onRequiereAuth}
          onPublicado={onPublicado}
        />
      </div>
    </div>
  );
}

function FormularioReporte({ categorias, onCerrar, onRequiereAuth, onPublicado }) {
  const showToast = useToast();
  const [campos, setCampos] = useState(VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave) => (e) => setCampos({ ...campos, [clave]: e.target.value });

  async function handleCreateReport(e) {
    e.preventDefault();
    if (!obtenerToken()) {
      onRequiereAuth();
      return;
    }

    const datos = {
      titulo: campos.titulo.trim(),
      descripcion: campos.descripcion.trim(),
      categoriaId: parseInt(campos.categoriaId, 10),
      ubicacion: campos.ubicacion.trim() || null,
      imagenUrl: campos.imagenUrl.trim() || null,
    };

    setError(null);
    setGuardando(true);

    try {
      const { status, json } = await crearReporte(datos);
      if (status === 201 && json.status === 'success') {
        onCerrar();
        showToast('¡Inconformidad publicada exitosamente!', 'success');
        onPublicado();
      } else {
        setError(json.message || 'Error al guardar la inconformidad');
      }
    } catch {
      setError('Error de conexión con el backend');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form id="formNewReport" onSubmit={handleCreateReport} className="p-6 space-y-4">

      {/* Error alert */}
      <div id="reportError" className={`${error === null ? 'hidden ' : ''}p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2`}>
        <i className="fa-solid fa-circle-exclamation text-rose-500 shrink-0"></i>
        <span id="reportErrorText">{error ?? 'Error al guardar'}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Título de la Inconformidad *</label>
        <input
          type="text"
          id="reportTitle"
          required
          minLength={5}
          maxLength={120}
          placeholder="Ej: Aire acondicionado fuera de servicio en Aula 204"
          className={CAMPO}
          value={campos.titulo}
          onChange={cambiar('titulo')}
        />
        <span className="text-[10px] text-slate-400">Entre 5 y 120 caracteres</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría del Problema *</label>
          <select id="reportCategory" required className={CAMPO} value={campos.categoriaId} onChange={cambiar('categoriaId')}>
            <option value="">Selecciona una categoría...</option>
            {(categorias || []).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ubicación en el Campus (Opcional)</label>
          <input
            type="text"
            id="reportLocation"
            maxLength={100}
            placeholder="Ej: Bloque A, piso 2, aula 204"
            className={CAMPO}
            value={campos.ubicacion}
            onChange={cambiar('ubicacion')}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Detallada *</label>
        <textarea
          id="reportDescription"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          placeholder="Describe qué ocurre, desde cuándo y cómo afecta tus clases o actividades académicas..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-iush-teal focus:outline-none"
          value={campos.descripcion}
          onChange={cambiar('descripcion')}
        ></textarea>
        <span className="text-[10px] text-slate-400">Mínimo 10 caracteres</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Evidencia / Foto (Opcional)</label>
        <input
          type="url"
          id="reportImage"
          placeholder="https://ejemplo.com/foto-evidencia.jpg"
          className={CAMPO}
          value={campos.imagenUrl}
          onChange={cambiar('imagenUrl')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" id="cancelReportBtn" onClick={onCerrar} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium">
          Cancelar
        </button>
        <button type="submit" id="submitReportBtn" disabled={guardando} className="bg-iush-teal hover:bg-iush-teal-hover text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2">
          {guardando ? (
            <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
          ) : (
            <><i className="fa-solid fa-paper-plane text-xs"></i> <span>Publicar Inconformidad</span></>
          )}
        </button>
      </div>

    </form>
  );
}
