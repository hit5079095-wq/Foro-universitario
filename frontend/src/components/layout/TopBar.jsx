export default function TopBar() {
  return (
    <div className="bg-iush-dark text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span><i className="fa-solid fa-location-dot text-iush-accent mr-1"></i> Sector Estadio: Carrera 70 # 52 – 49, Medellín</span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline"><i className="fa-brands fa-whatsapp text-emerald-400 mr-1"></i> +57 4 4 600 700</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <a href="https://iush.edu.co" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
            <span>Portal Institucional</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
          <span className="text-slate-600">|</span>
          <a href="/api/docs" target="_blank" className="hover:text-white transition-colors flex items-center gap-1 text-iush-accent">
            <i className="fa-solid fa-code"></i>
            <span>Swagger API</span>
          </a>
        </div>
      </div>
    </div>
  );
}
