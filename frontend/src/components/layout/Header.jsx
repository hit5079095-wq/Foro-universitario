import AuthControl from './AuthControl.jsx';
import CategoryNav from './CategoryNav.jsx';

export default function Header({
  busqueda,
  onBuscar,
  onLimpiarBusqueda,
  onNuevoReporte,
  onLogin,
  onLogout,
  categorias,
  categoriaActiva,
  onSeleccionarCategoria,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">

        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-iush-purple uppercase leading-none">
              Institución Universitaria
            </span>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-iush-navy tracking-tight group-hover:text-iush-teal transition-colors">
              Salazar y Herrera
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Foro Estudiantil de Inconformidades</span>
          </div>
        </a>

        {/* Quick Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              id="searchInput"
              placeholder="Buscar por aula, título o tema..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-iush-teal focus:border-transparent transition-all"
              value={busqueda}
              onChange={(e) => onBuscar(e.target.value)}
            />
            <button
              id="clearSearchBtn"
              onClick={onLimpiarBusqueda}
              className={`${busqueda ? '' : 'hidden '}absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs`}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Button: Nueva Inconformidad */}
          <button
            id="btnNewReport"
            onClick={onNuevoReporte}
            className="bg-iush-teal hover:bg-iush-teal-hover text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-5 py-2.5 rounded-full shadow-xs hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap active:scale-95"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Reportar Inconformidad</span>
          </button>

          {/* User / Auth Control */}
          <div id="authContainer" className="flex items-center gap-2">
            <AuthControl onLogin={onLogin} onLogout={onLogout} />
          </div>

        </div>
      </div>

      {/* Secondary University Navigation / Quick Categories */}
      <CategoryNav categorias={categorias} categoriaActiva={categoriaActiva} onSeleccionar={onSeleccionarCategoria} />
    </header>
  );
}
