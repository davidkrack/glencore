import React from 'react';
import { useContract } from '../../context/ContractContext';

const SyncStatus = () => {
  const { syncStatus, syncToSharePoint } = useContract();
  
  // Formatear la fecha de última sincronización
  const formatLastSync = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString();
  };
  
  // Manejar la sincronización manual
  const handleSyncNow = async () => {
    try {
      await syncToSharePoint();
    } catch (error) {
      console.error("Error al sincronizar manualmente:", error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Estado de sincronización con SharePoint</h3>
          <p className="text-xs text-gray-500 mt-1">
            Última sincronización: {formatLastSync(syncStatus.lastSync)}
          </p>
          {syncStatus.message && (
            <p className={`text-xs mt-1 ${
              syncStatus.message.includes('Error') 
                ? 'text-red-500' 
                : syncStatus.message.includes('exitosa') 
                  ? 'text-green-500' 
                  : 'text-blue-500'
            }`}>
              {syncStatus.message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleSyncNow}
          disabled={syncStatus.syncing}
          className={`px-3 py-1 rounded text-sm ${
            syncStatus.syncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {syncStatus.syncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sincronizando...
            </>
          ) : (
            'Sincronizar ahora'
          )}
        </button>
      </div>
    </div>
  );
};

export default SyncStatus;