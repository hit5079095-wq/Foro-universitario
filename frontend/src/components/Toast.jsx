const ICONOS = {
  success: 'fa-solid fa-circle-check text-emerald-400 text-base',
  error: 'fa-solid fa-circle-exclamation text-rose-400 text-base',
  info: 'fa-solid fa-circle-info text-sky-400 text-base',
};

export default function Toast({ visible, message, type }) {
  const base = 'fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300';
  return (
    <div id="toast" className={visible ? base : `${base} opacity-0 translate-y-3 pointer-events-none`}>
      <i id="toastIcon" className={ICONOS[type] || ICONOS.info}></i>
      <span id="toastMessage">{message}</span>
    </div>
  );
}
