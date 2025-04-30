import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ContractProvider, useContract } from '../context/ContractContext';
import ContractTable from '../components/Contract/ContractTable';
import SharePointConfig from '../components/SharePoint/SharePointConfig';
import logo from '../assets/logo.png';
import sharePointService from '../services/sharepoint';

// Componente de dashboard interno que puede usar el contexto de contratos
const DashboardContent = () => {
  const { currentUser, logout } = useAuth();
  const { contracts, syncFromSharePoint, loading } = useContract();
  const [activeView, setActiveView] = useState('all'); // 'all', 'active', 'pending', 'alerts'
  const [showSharePointConfig, setShowSharePointConfig] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    checked: false,
    connected: false,
    message: "Verificando conexión..."
  });
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Verificar la conexión con SharePoint al cargar
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await sharePointService.testConnection();
        setConnectionStatus({
          checked: true,
          connected: isConnected,
          message: isConnected 
            ? "Conectado a SharePoint" 
            : "No hay conexión con SharePoint. Configure los ajustes."
        });
      } catch (error) {
        setConnectionStatus({
          checked: true,
          connected: false,
          message: "Error al verificar conexión con SharePoint"
        });
      }
    };

    checkConnection();
  }, []);

  // Extraer conteos para las métricas
  const contractStats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'Active').length,
    pending: contracts.filter(c => c.status === 'Pending').length,
    withAlerts: contracts.filter(c => 
      c.renewal_alert === 'Crítico' || 
      c.renewal_alert === 'Alerta' || 
      c.process_start_alert === 'Atrasado' ||
      c.process_start_alert === 'Próximo'
    ).length
  };

  // Sincronizar SOLO UNA VEZ al cargar si hay conexión
  useEffect(() => {
    // Solo realizar la sincronización inicial si:
    // 1. Hay conexión con SharePoint
    // 2. No estamos en estado de carga
    // 3. No se ha realizado ya la sincronización inicial
    if (connectionStatus.connected && !loading && !initialSyncDone) {
      console.log("Realizando sincronización inicial desde SharePoint...");
      syncFromSharePoint()
        .then(() => {
          console.log("Sincronización inicial completa");
          setInitialSyncDone(true);
        })
        .catch(error => {
          console.error("Error en sincronización inicial:", error);
          setInitialSyncDone(true); // Marcar como realizada para no intentar de nuevo
        });
    }
  }, [connectionStatus.connected, loading, syncFromSharePoint, initialSyncDone]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={logo} alt="Logo" className="h-8 w-auto mr-3" />
            <h1 className="text-xl font-bold text-gray-900">Sourcing Plan Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser?.is_admin && (
              <button
                onClick={() => setShowSharePointConfig(true)}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                Configurar SharePoint
              </button>
            )}
            <span className="text-sm text-gray-600">
              {currentUser?.full_name || currentUser?.username}
            </span>
            <button 
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Estado de conexión con SharePoint */}
      {connectionStatus.checked && !connectionStatus.connected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 mx-4 mt-4 rounded shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                {connectionStatus.message}
                <button 
                  onClick={() => setShowSharePointConfig(true)}
                  className="ml-2 font-medium underline"
                >
                  Configurar ahora
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Header with Quick Filters */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Gestión de Contratos</h2>
              <p className="mt-1 text-sm text-gray-600">
                Administración completa del Sourcing Plan
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setActiveView('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeView === 'all' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveView('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeView === 'active' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setActiveView('pending')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeView === 'pending' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setActiveView('alerts')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  activeView === 'alerts' 
                    ? 'bg-white text-gray-900 shadow' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Con Alertas
              </button>
            </div>
          </div>
          
          {/* Dashboard Stats - KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Contratos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {contractStats.total}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Activos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {contractStats.active}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pendientes
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {contractStats.pending}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Con Alertas
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {contractStats.withAlerts}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabla de Contratos */}
          <ContractTable viewFilter={activeView} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Sourcing Plan App &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
      
      {/* SharePoint Config Modal */}
      <SharePointConfig 
        isOpen={showSharePointConfig} 
        onClose={() => {
          setShowSharePointConfig(false);
          // Volver a verificar la conexión después de cerrar la configuración
          sharePointService.testConnection()
            .then(isConnected => {
              setConnectionStatus({
                checked: true,
                connected: isConnected,
                message: isConnected 
                  ? "Conectado a SharePoint" 
                  : "No hay conexión con SharePoint. Configure los ajustes."
              });
            });
        }} 
      />
    </div>
  );
};

// Wrapper que provee el contexto de contratos
const DashboardPage = () => {
  return (
    <ContractProvider>
      <DashboardContent />
    </ContractProvider>
  );
};

export default DashboardPage;