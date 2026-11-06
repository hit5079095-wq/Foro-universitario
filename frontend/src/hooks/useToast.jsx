import { createContext, useCallback, useContext, useState } from 'react';
import Toast from '../components/Toast.jsx';

const ToastContext = createContext(() => {});

// Igual que showToast del original: cada llamada muestra el toast y programa
// su ocultación a los 3500 ms (sin cancelar ocultaciones previas).
export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: 'Operación realizada', type: 'success' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast {...toast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
