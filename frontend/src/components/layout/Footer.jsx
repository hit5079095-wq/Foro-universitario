export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          © 2026 <strong>Institución Universitaria Salazar y Herrera</strong> — Foro Estudiantil
        </div>
        <div className="flex items-center gap-4">
          <span>Sector Estadio · Carrera 70 # 52 – 49</span>
          <a href="/api/docs" className="text-iush-teal hover:underline">Documentación API</a>
        </div>
      </div>
    </footer>
  );
}
