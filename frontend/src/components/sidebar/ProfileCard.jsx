import { useAuth } from '../../context/AuthContext.jsx';

// Tarjeta "Estado de Sesión" (#sidebarProfileCard, contenido de renderAuthUI)
export default function ProfileCard({ onLogin, onLogout }) {
  const { user, autenticado } = useAuth();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs" id="sidebarProfileCard">
      <h3 className="font-display font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
        <i className="fa-solid fa-id-card text-iush-teal"></i>
        <span>Estado de Sesión</span>
      </h3>
      <div id="sidebarProfileContent">
        {autenticado ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-iush-teal text-white flex items-center justify-center text-sm font-bold">
                {user.nombre.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{user.nombre}</h4>
                <p className="text-[11px] text-slate-500">{user.correo || 'Cuenta activa'}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-800'}`}>
                  {user.rol === 'admin' ? 'Administrador' : 'Estudiante Activo'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Sesión iniciada</span>
              <button onClick={onLogout} className="text-rose-600 hover:underline font-medium">Salir</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Inicia sesión o regístrate con tu correo estudiantil para respaldar inconformidades y dar seguimiento.
            </p>
            <button
              onClick={onLogin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-lock text-xs"></i>
              <span>Ingresar al Foro</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
