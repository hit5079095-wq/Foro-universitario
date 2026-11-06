function Metrica({ id, valor, color, etiqueta }) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
      <div className={`text-xl sm:text-2xl font-bold font-display ${color} tabular-nums`} id={id}>{valor}</div>
      <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">{etiqueta}</div>
    </div>
  );
}

export default function Hero({ metricas, onNuevoReporte }) {
  const v = (clave) => (metricas ? metricas[clave] : '--');
  return (
    <section className="relative bg-gradient-to-r from-iush-navy via-iush-dark to-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20 mix-blend-overlay">
        <img src="/assets/aistudio/image_93b52f7f.png" alt="Salazar y Herrera Campus" className="w-full h-full object-cover" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-sky-200 mb-3 border border-white/10">
            <i className="fa-solid fa-bullhorn text-amber-300"></i>
            <span>Canal Oficial de Escucha Estudiantil IUSH</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
            Tus Inconformidades Impulsan la Calidad de Nuestro Campus
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Registra problemas en salones, equipos de cómputo, cafetería o infraestructura.
            Vota por las inconformidades de mayor urgencia para que la institución las priorice en tiempo real.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button id="heroReportBtn" onClick={onNuevoReporte} className="bg-iush-accent hover:bg-sky-400 text-iush-navy font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md transition-all flex items-center gap-2 active:scale-95">
              <i className="fa-solid fa-file-circle-plus"></i>
              <span>Subir mi Inconformidad</span>
            </button>
            <a href="#feedSection" className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-full backdrop-blur-xs transition-colors flex items-center gap-2">
              <i className="fa-solid fa-fire text-amber-400"></i>
              <span>Ver más apoyadas</span>
            </a>
          </div>
        </div>

        {/* Quick Metrics Board */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
          <Metrica id="metricTotal" valor={v('total')} color="text-white" etiqueta="Inconformidades" />
          <Metrica id="metricResueltos" valor={v('resueltos')} color="text-emerald-400" etiqueta="Resueltas" />
          <Metrica id="metricProceso" valor={v('proceso')} color="text-amber-300" etiqueta="En Proceso" />
          <Metrica id="metricVotos" valor={v('votos')} color="text-sky-300" etiqueta="Votos Totales" />
        </div>
      </div>
    </section>
  );
}
