import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

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

  // Filtrar contratos según criterios de búsqueda
  const filteredContracts = useCallback(() => {
    return contracts.filter(contract => {
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
  }, [contracts, filter]);

  // Cargar contratos al iniciar
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const value = {
    contracts,
    filteredContracts: filteredContracts(),
    loading,
    error,
    filter,
    setFilter,
    fetchContracts,
    getContract,
    createContract,
    updateContract,
    deleteContract,
    importFromExcel,
    exportToExcel
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