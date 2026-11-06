import ReportCard from './ReportCard.jsx';

// Contenido de #reportsList según el estado de loadReports / renderReportsList
export default function ReportList({ lista, isAdmin, onVotar, onAbrirDetalle, onCambiarEstado, onNuevoReporte }) {
  return (
    <div className="lg:col-span-2 space-y-4" id="reportsList">
      <Contenido
        lista={lista}
        isAdmin={isAdmin}
        onVotar={onVotar}
        onAbrirDetalle={onAbrirDetalle}
        onCambiarEstado={onCambiarEstado}
        onNuevoReporte={onNuevoReporte}
      />
    </div>
  );
}

function Contenido({ lista, isAdmin, onVotar, onAbrirDetalle, onCambiarEstado, onNuevoReporte }) {
  if (lista.tipo === 'inicial' || lista.tipo === 'cargando') {
    return (
      <div className="p-12 text-center text-slate-400">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-iush-teal mb-3"></i>
        <p className="text-sm">{lista.tipo === 'inicial' ? 'Cargando inconformidades del campus...' : 'Consultando inconformidades...'}</p>
      </div>
    );
  }

  if (lista.tipo === 'error') {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 text-xs">
        <i className="fa-solid fa-triangle-exclamation text-rose-500 text-lg mb-2"></i>
        <p>{lista.mensaje}</p>
      </div>
    );
  }

  if (lista.tipo === 'conexion') {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 text-xs">
        <p>No se pudo conectar con el servidor.</p>
      </div>
    );
  }

  if (!lista.reportes || lista.reportes.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 text-xl">
          <i className="fa-solid fa-inbox"></i>
        </div>
        <h4 className="font-display font-bold text-slate-800 text-sm mb-1">No se encontraron inconformidades</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Sé el primero en reportar un problema para esta categoría o criterio de búsqueda.
        </p>
        <button onClick={onNuevoReporte} className="bg-iush-teal text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-iush-teal-hover transition-colors">
          + Registrar Nueva Inconformidad
        </button>
      </div>
    );
  }

  return lista.reportes.map((report) => (
    <ReportCard
      key={report.id}
      report={report}
      isAdmin={isAdmin}
      onVotar={onVotar}
      onAbrirDetalle={onAbrirDetalle}
      onCambiarEstado={onCambiarEstado}
    />
  ));
}
