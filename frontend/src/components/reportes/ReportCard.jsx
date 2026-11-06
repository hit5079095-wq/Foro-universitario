import StatusBadge from './StatusBadge.jsx';
import { formatDate } from '../../utils/formato.js';

export default function ReportCard({ report, isAdmin, onVotar, onAbrirDetalle, onCambiarEstado }) {
  const yaVotado = Boolean(report.yaVote);

  return (
    <article className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all p-4 sm:p-5 flex items-start gap-3 sm:gap-4 group">

      {/* Voting Box Column (Left Anchor) */}
      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVotar(report.id, yaVotado);
          }}
          className={`w-12 sm:w-14 py-2 sm:py-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
            yaVotado
              ? 'bg-iush-teal border-iush-teal text-white shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-iush-teal hover:bg-sky-50 hover:text-iush-teal'
          }`}
          title={yaVotado ? 'Quitar mi voto' : 'Apoyar esta inconformidad (a mí también me pasa)'}
        >
          <i className={`fa-solid fa-arrow-up text-xs sm:text-sm mb-0.5 ${yaVotado ? 'animate-bounce' : ''}`}></i>
          <span className="font-display font-bold text-sm sm:text-base tabular-nums leading-none">
            {report.totalVotos ?? 0}
          </span>
          <span className="text-[9px] font-semibold uppercase mt-0.5 opacity-80">
            {yaVotado ? 'Votado' : 'Votar'}
          </span>
        </button>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0">

        {/* Category & Status Line */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
          <span className="text-xs font-semibold text-iush-purple">
            {report.categoria?.nombre || 'General'}
          </span>
          <span className="text-slate-300">·</span>
          <StatusBadge estado={report.estado} />
          {report.ubicacion && (
            <>
              <span className="text-slate-300 hidden sm:inline">·</span>
              <span className="text-slate-500 text-[11px] truncate max-w-[200px] hidden sm:inline">
                <i className="fa-solid fa-location-dot text-slate-400 mr-0.5"></i> {report.ubicacion}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onAbrirDetalle(report.id)}
          className="font-display font-bold text-slate-900 text-sm sm:text-base mb-1.5 hover:text-iush-teal cursor-pointer transition-colors leading-snug line-clamp-2"
        >
          {report.titulo}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
          {report.descripcion}
        </p>

        {/* Footer Meta & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <span>Por <strong>{report.autor || 'Estudiante'}</strong></span>
            <span>·</span>
            <span>{formatDate(report.creadoEn)}</span>
            {report.ubicacion && (
              <>
                <span className="sm:hidden">·</span>
                <span className="sm:hidden truncate max-w-[120px]">{report.ubicacion}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onAbrirDetalle(report.id)}
              className="text-xs font-medium text-slate-600 hover:text-iush-teal transition-colors flex items-center gap-1.5"
            >
              <i className="fa-regular fa-comment text-slate-400"></i>
              <span>{report.totalComentarios || 0}</span>
            </button>

            {/* Admin State Quick Toggle */}
            {isAdmin && (
              <select
                key={report.estado}
                defaultValue={report.estado}
                onChange={(e) => onCambiarEstado(report.id, e.target.value)}
                className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium"
              >
                <option value="pendiente">⏳ Pendiente</option>
                <option value="en_proceso">⚙️ En Proceso</option>
                <option value="resuelto">✅ Resuelto</option>
              </select>
            )}
          </div>
        </div>

      </div>

    </article>
  );
}
