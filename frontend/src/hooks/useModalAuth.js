import { useCallback, useState } from 'react';

// Estado del modal de autenticación (openAuthModal / closeAuthModal / showLoginTab / showRegisterTab).
export function useModalAuth() {
  const [abierto, setAbierto] = useState(false);
  const [tab, setTab] = useState('login');
  const [error, setError] = useState(null);

  const abrir = useCallback(() => {
    setAbierto(true);
    setError(null);
    setTab('login');
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  const mostrarTab = useCallback((nuevaTab) => {
    setTab(nuevaTab);
    setError(null);
  }, []);

  return { abierto, tab, error, setError, abrir, cerrar, mostrarTab };
}
