// Barra secundaria de categorías (renderCategoryNav). Las clases activas/inactivas
// reproducen exactamente el resultado de los classList.add/remove del original.
const TODAS_BASE = 'cat-pill px-3.5 py-1.5 rounded-full shrink-0';
const CAT_BASE = 'cat-pill px-3 py-1.5 rounded-full font-medium hover:bg-white hover:text-slate-900 hover:shadow-2xs transition-all shrink-0';
const ACTIVA = 'active bg-white text-iush-navy font-semibold border border-slate-200 shadow-2xs';
const INACTIVA = 'text-slate-600';

export default function CategoryNav({ categorias, categoriaActiva, onSeleccionar }) {
  return (
    <div className="bg-slate-50 border-t border-slate-100 overflow-x-auto no-scrollbar py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 text-xs whitespace-nowrap" id="categoryNavContainer">
        {categorias === null ? (
          // Marcado inicial antes de cargar las categorías (sin manejador, como el original)
          <button data-cat="" className="cat-pill active px-3 py-1.5 rounded-full font-medium text-slate-700 bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors">
            Todas las Categorías
          </button>
        ) : (
          <>
            <button
              data-cat=""
              onClick={() => onSeleccionar('')}
              className={`${TODAS_BASE} ${categoriaActiva === '' ? ACTIVA : INACTIVA}`}
            >
              Todas las Categorías
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                data-cat={cat.id}
                onClick={() => onSeleccionar(String(cat.id))}
                className={`${CAT_BASE} ${categoriaActiva === String(cat.id) ? ACTIVA : INACTIVA}`}
              >
                {cat.nombre}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
