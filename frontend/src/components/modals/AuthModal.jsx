import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { iniciarSesion, registrarUsuario } from '../../api/auth.js';

const TAB_ACTIVA = 'flex-1 py-3 text-center border-b-2 border-iush-teal text-iush-navy bg-white font-bold';
const TAB_INACTIVA = 'flex-1 py-3 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-medium';
const INPUT = 'w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-iush-teal focus:outline-none';

// MODAL: AUTENTICACIÓN (LOGIN / REGISTRO). Se mantiene montado (como el original con
// la clase `hidden`), así los campos conservan su valor entre aperturas.
export default function AuthModal({ modal }) {
  const { saveSession } = useAuth();
  const showToast = useToast();
  const { abierto, tab, error, setError, cerrar, mostrarTab } = modal;

  const [login, setLogin] = useState({ correo: '', password: '' });
  const [registro, setRegistro] = useState({ nombre: '', correo: '', password: '' });

  const fillLogin = (correo, password) => setLogin({ correo, password });

  async function handleLogin(e) {
    e.preventDefault();
    const correo = login.correo.trim();
    const password = login.password;
    setError(null);

    try {
      const { json } = await iniciarSesion(correo, password);
      if (json.status === 'success' && json.data?.token) {
        saveSession(json.data.token, json.data.usuario);
        cerrar();
        showToast(`¡Bienvenido, ${json.data.usuario.nombre}!`, 'success');
      } else {
        setError(json.message || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error al conectar con el servidor');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const nombre = registro.nombre.trim();
    const correo = registro.correo.trim();
    const password = registro.password;
    setError(null);

    try {
      const { status, json } = await registrarUsuario(nombre, correo, password);
      if (status === 201) {
        // Auto login tras registrarse correctamente
        const { json: loginJson } = await iniciarSesion(correo, password);
        if (loginJson.status === 'success' && loginJson.data?.token) {
          saveSession(loginJson.data.token, loginJson.data.usuario);
          cerrar();
          showToast('Cuenta creada e iniciada exitosamente', 'success');
        } else {
          mostrarTab('login');
          fillLogin(correo, password);
          showToast('Cuenta creada. Ya puedes iniciar sesión', 'success');
        }
      } else {
        setError(json.message || 'Error al registrar usuario');
      }
    } catch {
      setError('Error al registrarte en el servidor');
    }
  }

  const esLogin = tab === 'login';

  return (
    <div id="authModal" className={`fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop${abierto ? '' : ' hidden'}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-iush-navy to-iush-dark p-6 text-white text-center relative">
          <button id="closeAuthModal" onClick={cerrar} className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg">
            <i className="fa-solid fa-xmark"></i>
          </button>
          <span className="text-[10px] font-bold tracking-widest text-iush-accent uppercase">Acceso Estudiantil</span>
          <h2 className="font-display text-xl font-bold mt-1" id="authModalTitle">{esLogin ? 'Iniciar Sesión' : 'Registro de Estudiante'}</h2>
          <p className="text-xs text-slate-300 mt-1">Conecta con tu cuenta para votar y crear reportes</p>
        </div>

        {/* Auth Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button id="tabLogin" onClick={() => mostrarTab('login')} className={esLogin ? TAB_ACTIVA : TAB_INACTIVA}>
            Iniciar Sesión
          </button>
          <button id="tabRegister" onClick={() => mostrarTab('registro')} className={esLogin ? TAB_INACTIVA : TAB_ACTIVA}>
            Registrar Estudiante
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">

          {/* Error Alert */}
          <div id="authError" className={`${error === null ? 'hidden ' : ''}mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2`}>
            <i className="fa-solid fa-circle-exclamation text-rose-500 shrink-0"></i>
            <span id="authErrorText">{error ?? 'Error al autenticar'}</span>
          </div>

          {/* Form: Login */}
          <form id="formLogin" onSubmit={handleLogin} className={`space-y-4${esLogin ? '' : ' hidden'}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="email" id="loginEmail" required placeholder="tu_correo@foro.com" className={INPUT}
                  value={login.correo} onChange={(e) => setLogin({ ...login, correo: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="password" id="loginPassword" required placeholder="••••••••" className={INPUT}
                  value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="w-full bg-iush-navy hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-xs">
              Ingresar al Foro
            </button>

            {/* Quick Test Accounts Helper */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block mb-1">Cuentas demo listas:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => fillLogin('ana@foro.com', 'Estudiante123')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-left truncate">
                  👩‍🎓 <strong>Ana</strong> (Estudiante)
                </button>
                <button type="button" onClick={() => fillLogin('admin@foro.com', 'Admin1234')} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-left truncate">
                  🛡️ <strong>Admin</strong> (Moderador)
                </button>
              </div>
            </div>
          </form>

          {/* Form: Register */}
          <form id="formRegister" onSubmit={handleRegister} className={`space-y-4${esLogin ? ' hidden' : ''}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="text" id="regName" required placeholder="Ej: Carlos Gómez" className={INPUT}
                  value={registro.nombre} onChange={(e) => setRegistro({ ...registro, nombre: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="email" id="regEmail" required placeholder="carlos@foro.com o @iush.edu.co" className={INPUT}
                  value={registro.correo} onChange={(e) => setRegistro({ ...registro, correo: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña (mínimo 8 caracteres)</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input type="password" id="regPassword" required minLength={8} maxLength={72} placeholder="Mínimo 8 caracteres" className={INPUT}
                  value={registro.password} onChange={(e) => setRegistro({ ...registro, password: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="w-full bg-iush-teal hover:bg-iush-teal-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-xs">
              Registrarme como Estudiante
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
