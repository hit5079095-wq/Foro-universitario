const PASOS = [
  { n: 1, titulo: 'Registra:', texto: 'Publica la falla o mejora que necesita el aula, equipo o área del campus.' },
  { n: 2, titulo: 'Vota:', texto: 'Pulsa en "A mí también me pasa" para que el reporte gane importancia y visibilidad.' },
  { n: 3, titulo: 'Solución:', texto: 'La administración actualiza el estado a "En Proceso" o "Resuelto".' },
];

export default function HowItWorks() {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-iush-navy text-white p-5 rounded-2xl shadow-sm">
      <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 text-sky-300">
        <i className="fa-solid fa-lightbulb"></i>
        <span>¿Cómo funciona el Foro?</span>
      </h3>
      <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
        {PASOS.map((p) => (
          <li key={p.n} className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-sky-400 shrink-0">{p.n}</span>
            <span><strong>{p.titulo}</strong> {p.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
