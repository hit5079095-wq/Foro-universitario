export default function CampusInfo() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-xs text-slate-600 space-y-2.5">
      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
        <i className="fa-solid fa-building-columns text-iush-purple"></i>
        <span>Institución Universitaria Salazar y Herrera</span>
      </h4>
      <p className="leading-relaxed">Sede Principal Estadio, Medellín. Espacio estudiantil para el mejoramiento continuo de la infraestructura y servicios universitarios.</p>
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
        <span>Atención: Lunes a Viernes</span>
        <span className="font-semibold text-slate-700">7:00 a.m. - 9:00 p.m.</span>
      </div>
    </div>
  );
}
