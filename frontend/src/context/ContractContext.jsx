import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import sharePointService from '../services/sharepoint';

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [syncStatus, setSyncStatus] = useState({
    syncing: false,
    lastSync: null,
    message: null
  });
  
  // Referencia para evitar sincronizaciones múltiples
  const syncInProgress = useRef(false);
  // Referencia para evitar la sincronización automática al iniciar
  const initialSyncDone = useRef(false);
  // ID de timeout para uso con debounce
  const syncTimeoutRef = useRef(null);

  // Función debounce para evitar múltiples sincronizaciones en poco tiempo
  const debouncedSync = useCallback((fn, delay = 1000) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      fn();
      syncTimeoutRef.current = null;
    }, delay);
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/contracts');
      setContracts(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar contratos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getContract = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/contracts/${id}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || `Error al obtener contrato ${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createContract = useCallback(async (contractData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.post('/contracts', contractData);
      setContracts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear contrato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContract = useCallback(async (id, contractData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.put(`/contracts/${id}`, contractData);
      
      // Actualizar el estado local
      setContracts(prev => 
        prev.map(contract => contract.id === id ? response.data : contract)
      );
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar contrato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContract = useCallback(async (id) => {
    try {
      setError(null);
      setLoading(true);
      await api.delete(`/contracts/${id}`);
      
      // Actualizar el estado local
      setContracts(prev => prev.filter(contract => contract.id !== id));
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar contrato');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const importFromExcel = useCallback(async (file) => {
    try {
      setError(null);
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/excel/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Recargar los contratos después de importar
      await fetchContracts();
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al importar desde Excel');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  const exportToExcel = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get('/excel/export', {
        responseType: 'blob'
      });
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sourcing_plan_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al exportar a Excel');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para sincronizar desde SharePoint - controlada para evitar ejecuciones simultáneas
  const syncFromSharePoint = useCallback(async () => {
    // Si ya hay una sincronización en progreso, no iniciar otra
    if (syncInProgress.current) {
      console.log("Sincronización ya en progreso, ignorando solicitud");
      return { message: "Ya hay una sincronización en progreso" };
    }
    
    try {
      syncInProgress.current = true;
      setError(null);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncing: true, 
        message: 'Sincronizando desde SharePoint...' 
      }));
      
      const response = await sharePointService.syncFromSharePoint();
      
      // Marcar que la sincronización inicial se ha completado
      initialSyncDone.current = true;
      
      // Recargar contratos después de sincronizar
      await fetchContracts();
      
      setSyncStatus({
        syncing: false,
        lastSync: new Date(),
        message: `Sincronización desde SharePoint exitosa: ${response.message || ''}`
      });
      
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al sincronizar desde SharePoint';
      setSyncStatus({
        syncing: false,
        lastSync: new Date(),
        message: `Error: ${errorMsg}`
      });
      setError(errorMsg);
      return null;
    } finally {
      syncInProgress.current = false;
    }
  }, [fetchContracts]);

  // Función para sincronizar hacia SharePoint - controlada para evitar ejecuciones simultáneas
  const syncToSharePoint = useCallback(async () => {
    // Si ya hay una sincronización en progreso, no iniciar otra
    if (syncInProgress.current) {
      console.log("Sincronización ya en progreso, ignorando solicitud");
      return { message: "Ya hay una sincronización en progreso" };
    }
    
    try {
      syncInProgress.current = true;
      setError(null);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncing: true, 
        message: 'Sincronizando hacia SharePoint...' 
      }));
      
      // Aplicar debounce - espera un poco antes de sincronizar para asegurar
      // que no hay múltiples operaciones de sincronización seguidas
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await sharePointService.syncToSharePoint();
      
      setSyncStatus({
        syncing: false,
        lastSync: new Date(),
        message: `Sincronización hacia SharePoint exitosa: ${response.message || ''}`
      });
      
      // Hacer que el mensaje de éxito desaparezca después de 5 segundos
      setTimeout(() => {
        setSyncStatus(prev => ({
          ...prev,
          message: null
        }));
      }, 5000);
      
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al sincronizar hacia SharePoint';
      setSyncStatus({
        syncing: false,
        lastSync: new Date(),
        message: `Error: ${errorMsg}`
      });
      setError(errorMsg);
      return null;
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  // Filtrar contratos según criterios de búsqueda
  const filteredContracts = contracts.filter(contract => {
    const matchSearch = filter.search 
      ? (
          contract.contract_number?.toLowerCase().includes(filter.search.toLowerCase()) ||
          contract.description?.toLowerCase().includes(filter.search.toLowerCase()) ||
          contract.supplier?.toLowerCase().includes(filter.search.toLowerCase())
        )
      : true;
    
    const matchStatus = filter.status 
      ? contract.status === filter.status 
      : true;
    
    const matchDateFrom = filter.dateFrom 
      ? new Date(contract.start_date) >= new Date(filter.dateFrom) 
      : true;
    
    const matchDateTo = filter.dateTo 
      ? new Date(contract.end_date) <= new Date(filter.dateTo) 
      : true;
    
    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  // Cargar contratos al iniciar
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const value = {
    contracts,
    filteredContracts,
    loading,
    error,
    filter,
    setFilter,
    syncStatus,
    fetchContracts,
    getContract,
    createContract,
    updateContract,
    deleteContract,
    importFromExcel,
    exportToExcel,
    syncFromSharePoint,
    syncToSharePoint,
    // Exponer para verificación externa
    isInitialSyncDone: () => initialSyncDone.current
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract debe ser usado dentro de un ContractProvider');
  }
  return context;
};