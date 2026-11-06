import { useAuth } from '../../context/AuthContext.jsx';

// Contenido de #authContainer (renderAuthUI, parte de la cabecera)
export default function AuthControl({ onLogin, onLogout }) {
  const { user, autenticado } = useAuth();

  if (autenticado) {
    return (
      <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
        <div className="w-8 h-8 rounded-full bg-iush-navy text-white flex items-center justify-center font-bold text-xs uppercase" title={user.nombre}>
          {user.nombre.charAt(0)}
        </div>
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user.nombre}</span>
          <span className="text-[10px] text-iush-teal font-medium uppercase">{user.rol === 'admin' ? '🛡️ Moderador' : 'Estudiante'}</span>
        </div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 transition-colors text-xs ml-1" title="Cerrar sesión">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLogin}
      className="border border-slate-300 hover:border-iush-navy text-slate-700 hover:text-iush-navy text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
    >
      <i className="fa-regular fa-user"></i>
      <span>Ingresar</span>
    </button>
  );
}
