import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ContractProvider } from '../context/ContractContext';
import ContractTable from '../components/Contract/ContractTable';
import SharePointConfig from '../components/SharePoint/SharePointConfig';
import logo from '../assets/logo.png';

const DashboardPage = () => {
  const { currentUser, logout } = useAuth();
  const [activeView, setActiveView] = useState('all'); // 'all', 'active', 'pending', 'alerts'
  const [showSharePointConfig, setShowSharePointConfig] = useState(false);

  return (
    <ContractProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header / Navbar */}
        <header className="bg-white shadow z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <img src={logo} alt="Glencore Logo" className="h-8 w-auto mr-3" />
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
                          153
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
                          84
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
                          47
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
                          22
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
              Sourcing Plan App &copy; {new Date().getFullYear()} Glencore
            </p>
          </div>
        </footer>
        
        {/* SharePoint Config Modal */}
        <SharePointConfig 
          isOpen={showSharePointConfig} 
          onClose={() => setShowSharePointConfig(false)} 
        />
      </div>
    </ContractProvider>
  );
};

export default DashboardPage;