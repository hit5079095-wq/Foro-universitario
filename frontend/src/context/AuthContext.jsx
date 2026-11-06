import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { establecerToken } from '../api/cliente.js';
import { useToast } from '../hooks/useToast.jsx';

const TOKEN_KEY = 'foro_iush_token';
const USER_KEY = 'foro_iush_user';

const AuthContext = createContext(null);

// loadSession del original: lee token y usuario; si el usuario está corrupto, cierra sesión.
function cargarSesion() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (token && userRaw) {
    try {
      return { token, user: JSON.parse(userRaw), corrupta: false };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, user: null, corrupta: true };
    }
  }
  // Como en el original, el token puede existir sin usuario (authToken sí queda definido).
  return { token, user: null, corrupta: false };
}

export function AuthProvider({ children }) {
  const showToast = useToast();
  const [sesion, setSesion] = useState(() => {
    const s = cargarSesion();
    establecerToken(s.token);
    return s;
  });

  // El original llamaba a logout() (con su toast) cuando el usuario guardado no era JSON válido.
  useEffect(() => {
    if (sesion.corrupta) showToast('Has cerrado sesión correctamente', 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    establecerToken(token);
    setSesion({ token, user, corrupta: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    establecerToken(null);
    setSesion({ token: null, user: null, corrupta: false });
    showToast('Has cerrado sesión correctamente', 'info');
  }, [showToast]);

  const value = {
    token: sesion.token,
    user: sesion.user,
    // La UI "autenticada" requiere usuario y token, igual que renderAuthUI.
    autenticado: Boolean(sesion.user && sesion.token),
    saveSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
