// Fecha relativa o amigable (idéntica a formatDate del script original)
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  } else if (diffDays >= 1) {
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours >= 1) {
    return `hace ${diffHours} h`;
  } else if (diffMins >= 1) {
    return `hace ${diffMins} min`;
  } else {
    return 'hace un momento';
  }
}

// Configuración de la insignia de estado (getStatusBadge original)
export function getStatusBadge(estado) {
  switch (estado) {
    case 'resuelto':
      return { label: 'Resuelto', icon: 'fa-solid fa-check', class: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    case 'en_proceso':
      return { label: 'En Proceso', icon: 'fa-solid fa-arrows-rotate', class: 'bg-amber-50 text-amber-700 border border-amber-200' };
    case 'pendiente':
    default:
      return { label: 'Pendiente', icon: 'fa-regular fa-clock', class: 'bg-slate-100 text-slate-600 border border-slate-200' };
  }
}
