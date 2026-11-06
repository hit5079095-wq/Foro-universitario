import { getStatusBadge } from '../../utils/formato.js';

// Insignia de estado de las tarjetas del listado
export default function StatusBadge({ estado }) {
  const s = getStatusBadge(estado);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${s.class}`}>
      <i className={s.icon}></i>
      <span>{s.label}</span>
    </span>
  );
}
