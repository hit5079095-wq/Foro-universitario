import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './hooks/useToast.jsx';
import { useCategorias } from './hooks/useCategorias.js';
import { useEstadisticas } from './hooks/useEstadisticas.js';
import { useReportes } from './hooks/useReportes.js';
import { useModalAuth } from './hooks/useModalAuth.js';
import { useDetalleReporte } from './hooks/useDetalleReporte.js';
import { cambiarEstado, quitarVoto, votar } from './api/reportes.js';
import TopBar from './components/layout/TopBar.jsx';
import Header from './components/layout/Header.jsx';
import Hero from './components/layout/Hero.jsx';
import Footer from './components/layout/Footer.jsx';
import FiltrosBar from './components/reportes/FiltrosBar.jsx';
import ReportList from './components/reportes/ReportList.jsx';
import Sidebar from './components/sidebar/Sidebar.jsx';
import AuthModal from './components/modals/AuthModal.jsx';
import NewReportModal from './components/modals/NewReportModal.jsx';
import DetailModal from './components/modals/DetailModal.jsx';

export default function App() {
  const { token, user, logout } = useAuth();
  const showToast = useToast();
  const { categorias, loadCategories } = useCategorias();
  const { metricas, loadStatistics } = useEstadisticas();
  const { lista, filtros, setFiltro, loadReports } = useReportes();
  const modalAuth = useModalAuth();
  const detalle = useDetalleReporte();

  const [busqueda, setBusqueda] = useState('');
  const debounceRef = useRef(null);
  const [reporteModal, setReporteModal] = useState({ abierto: false, apertura: 0 });

  const isAdmin = Boolean(user && user.rol === 'admin');

  // Init App (DOMContentLoaded): categorías, estadísticas y reportes
  useEffect(() => {
    loadCategories();
    loadStatistics();
    loadReports();
  }, [loadCategories, loadStatistics, loadReports]);

  // saveSession() y logout() recargaban los reportes (estado yaVote)
  const tokenPrevioRef = useRef(token);
  useEffect(() => {
    if (tokenPrevioRef.current !== token) {
      tokenPrevioRef.current = token;
      loadReports();
    }
  }, [token, loadReports]);

  const openAuthModal = modalAuth.abrir;

  const openNewReportModal = useCallback(() => {
    if (!token) {
      openAuthModal();
      showToast('Inicia sesión o regístrate para publicar tu reporte', 'info');
      return;
    }
    setReporteModal((m) => ({ abierto: true, apertura: m.apertura + 1 }));
  }, [token, openAuthModal, showToast]);

  const closeNewReportModal = useCallback(() => setReporteModal((m) => ({ ...m, abierto: false })), []);

  // Búsqueda con debounce de 300 ms
  function handleBuscar(valor) {
    setBusqueda(valor);
    setFiltro('q', valor);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadReports();
    }, 300);
  }

  function handleLimpiarBusqueda() {
    setBusqueda('');
    setFiltro('q', '');
    loadReports();
  }

  function handleOrden(orden) {
    setFiltro('orden', orden);
    loadReports();
  }

  function handleEstado(estado) {
    setFiltro('estado', estado);
    loadReports();
  }

  function handleCategoria(categoriaId) {
    setFiltro('categoriaId', categoriaId);
    loadReports();
  }

  function handleRefrescar() {
    loadReports();
    loadStatistics();
    showToast('Inconformidades actualizadas', 'info');
  }

  // handleVoteClick
  async function handleVotar(reporteId, currentlyVoted) {
    if (!token) {
      openAuthModal();
      showToast('Inicia sesión para votar por esta inconformidad', 'info');
      return;
    }

    try {
      const { status, json } = currentlyVoted ? await quitarVoto(reporteId) : await votar(reporteId);
      if (status === 201) {
        showToast('¡Voto registrado! Aportaste relevancia a este caso', 'success');
        loadReports();
        loadStatistics();
      } else if (status === 200 && currentlyVoted) {
        showToast('Voto eliminado', 'info');
        loadReports();
        loadStatistics();
      } else if (status === 409) {
        showToast('Ya habías votado por este reporte', 'info');
      } else {
        showToast(json.message || 'Error al procesar voto', 'error');
      }
    } catch (err) {
      console.error('Error votando:', err);
      showToast('Error de conexión', 'error');
    }
  }

  // changeReportState (selector visible solo para admin, como en el original)
  async function handleCambiarEstado(reporteId, nuevoEstado) {
    if (!token) return;
    try {
      const { json } = await cambiarEstado(reporteId, nuevoEstado);
      if (json.status === 'success') {
        showToast(`Estado actualizado a: ${nuevoEstado}`, 'success');
        loadReports();
        loadStatistics();
      } else {
        showToast(json.message || 'Error al actualizar estado', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    }
  }

  function handlePublicado() {
    loadReports();
    loadStatistics();
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <TopBar />

      <Header
        busqueda={busqueda}
        onBuscar={handleBuscar}
        onLimpiarBusqueda={handleLimpiarBusqueda}
        onNuevoReporte={openNewReportModal}
        onLogin={openAuthModal}
        onLogout={logout}
        categorias={categorias}
        categoriaActiva={filtros.categoriaId}
        onSeleccionarCategoria={handleCategoria}
      />

      <Hero metricas={metricas} onNuevoReporte={openNewReportModal} />

      {/* MAIN CONTENT / FEED SECTION */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8" id="feedSection">

        <FiltrosBar
          orden={filtros.orden}
          onOrden={handleOrden}
          estado={filtros.estado}
          onEstado={handleEstado}
          onRefrescar={handleRefrescar}
        />

        {/* FEED CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ReportList
            lista={lista}
            isAdmin={isAdmin}
            onVotar={handleVotar}
            onAbrirDetalle={detalle.openReportDetails}
            onCambiarEstado={handleCambiarEstado}
            onNuevoReporte={openNewReportModal}
          />
          <Sidebar onLogin={openAuthModal} onLogout={logout} />
        </div>

      </main>

      <Footer />

      <AuthModal modal={modalAuth} />

      <NewReportModal
        abierto={reporteModal.abierto}
        apertura={reporteModal.apertura}
        categorias={categorias}
        onCerrar={closeNewReportModal}
        onRequiereAuth={openAuthModal}
        onPublicado={handlePublicado}
      />

      <DetailModal detalleHook={detalle} onRequiereAuth={openAuthModal} onComentado={loadReports} />
    </div>
  );
}
