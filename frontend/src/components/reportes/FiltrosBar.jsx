// Barra de orden, filtro de estado y refresco (CONTROLS & FILTER BAR).
// Las clases activas/inactivas reproducen el resultado de los classList del original.
const ORDENES = [
  {
    clave: 'mas_apoyados',
    base: 'sort-btn px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5',
    icono: 'fa-solid fa-fire text-amber-400',
    texto: 'Más Apoyados (Mayor Importancia)',
  },
  {
    clave: 'recientes',
    base: 'sort-btn px-3.5 py-1.5 rounded-lg text-xs font-medium hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0 flex items-center gap-1.5',
    icono: 'fa-regular fa-clock',
    texto: 'Más Recientes',
  },
  {
    clave: 'mas_comentados',
    base: 'sort-btn px-3.5 py-1.5 rounded-lg text-xs font-medium hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0 flex items-center gap-1.5',
    icono: 'fa-regular fa-comments',
    texto: 'Más Comentados',
  },
];

export default function FiltrosBar({ orden, onOrden, estado, onEstado, onRefrescar }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

      {/* Sorting Selector: Default is Más apoyados */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
          <i className="fa-solid fa-arrow-down-wide-short mr-1"></i> Ordenar:
        </span>
        {ORDENES.map((o) => (
          <button
            key={o.clave}
            data-sort={o.clave}
            onClick={() => onOrden(o.clave)}
            className={`${o.base} ${orden === o.clave ? 'active bg-iush-navy text-white shadow-xs' : 'text-slate-600'}`}
          >
            <i className={o.icono}></i>
            <span>{o.texto}</span>
          </button>
        ))}
      </div>

      {/* State Filter & Mobile Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:w-44">
          <select
            id="stateFilter"
            value={estado}
            onChange={(e) => onEstado(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-iush-teal"
          >
            <option value="">Todos los Estados</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="en_proceso">⚙️ En Proceso</option>
            <option value="resuelto">✅ Resueltos</option>
          </select>
        </div>

        <button id="refreshBtn" onClick={onRefrescar} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:text-iush-teal hover:bg-slate-50 transition-colors" title="Actualizar lista">
          <i className="fa-solid fa-rotate-right text-xs"></i>
        </button>
      </div>

    </div>
  );
}
