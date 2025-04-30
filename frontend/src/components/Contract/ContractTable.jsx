import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';
import ContractFilter from './ContractFilter';
import ImportExportTools from './ImportExportTools';
import Modal from '../common/Modal';
import ContractForm from './ContractForm';
import Pagination from '../common/Pagination';

const ContractTable = ({ viewFilter }) => {
  const { 
    filteredContracts, 
    loading, 
    error, 
    deleteContract,
    syncToSharePoint,
    syncStatus
  } = useContract();
  
  // Estado para controlar modales
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedContracts, setDisplayedContracts] = useState([]);

  // Aplicar paginación cada vez que cambian los contratos filtrados
  useEffect(() => {
    if (filteredContracts) {
      // Aplicar filtro de vista si existe
      let contracts = [...filteredContracts];
      
      if (viewFilter) {
        if (viewFilter === 'active') {
          contracts = contracts.filter(c => c.status === 'Active');
        } else if (viewFilter === 'pending') {
          contracts = contracts.filter(c => c.status === 'Pending');
        } else if (viewFilter === 'alerts') {
          contracts = contracts.filter(c => 
            c.renewal_alert === 'Crítico' || 
            c.renewal_alert === 'Alerta' || 
            c.process_start_alert === 'Atrasado' ||
            c.process_start_alert === 'Próximo'
          );
        }
      }
      
      // Calcular páginas
      const total = Math.ceil(contracts.length / contractsPerPage);
      setTotalPages(total === 0 ? 1 : total);
      
      // Ajustar página actual si está fuera de rango
      if (currentPage > total && total > 0) {
        setCurrentPage(1);
      }
      
      // Obtener contratos de la página actual
      const indexOfLastContract = currentPage * contractsPerPage;
      const indexOfFirstContract = indexOfLastContract - contractsPerPage;
      const slicedContracts = contracts.slice(indexOfFirstContract, indexOfLastContract);
      
      setDisplayedContracts(slicedContracts);
    }
  }, [filteredContracts, currentPage, contractsPerPage, viewFilter]);

  // Funciones para manejo de acciones
  const handleCreate = () => {
    setModalType('create');
    setSelectedContract(null);
    setShowModal(true);
  };

  const handleEdit = (contract) => {
    setModalType('edit');
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleDelete = (contract) => {
    setModalType('delete');
    setSelectedContract(contract);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (selectedContract) {
      await deleteContract(selectedContract.id);
      setShowModal(false);
      
      // Sincronizar con SharePoint después de eliminar
      await syncToSharePoint();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  const handleCloseModalAndSync = async () => {
    setShowModal(false);
    setSelectedContract(null);
    
    // Sincronizar con SharePoint después de crear/editar
    if (!syncStatus.syncing) {
      await syncToSharePoint();
    }
  };

  // Cambiar de página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Formatear fechas en formato DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
  };

  // Formatear moneda
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return '-';
    return `${currency} ${Number(amount).toLocaleString('es-CL', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Renderizar estado con color según valor
  const renderStatus = (status) => {
    let bgColor = '';
    let textColor = '';
    let label = '';

    switch (status) {
      case 'Active':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        label = 'Activo';
        break;
      case 'Pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        label = 'Pendiente';
        break;
      case 'Closed':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        label = 'Cerrado';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        label = status || 'Desconocido';
    }

    return (
      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-lg font-bold text-gray-800">Contratos</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCreate}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Nuevo Contrato
          </button>
          
          {/* Botón de sincronización manual */}
          <button
            onClick={syncToSharePoint}
            disabled={syncStatus.syncing}
            className={`px-3 py-2 rounded flex items-center ${
              syncStatus.syncing 
                ? 'bg-gray-400 text-gray-100 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {syncStatus.syncing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sincronizando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar con SharePoint
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mostrar mensaje de sincronización si existe */}
      {syncStatus.message && (
        <div className={`p-2 text-center text-sm ${
          syncStatus.message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : syncStatus.message.includes('exitosa') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
        }`}>
          {syncStatus.message}
        </div>
      )}

      <ContractFilter />
      <ImportExportTools />

      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Contenedor principal con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Cargando contratos...</p>
                </td>
              </tr>
            ) : displayedContracts.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron contratos
                </td>
              </tr>
            ) : (
              displayedContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contract_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs overflow-hidden text-ellipsis">
                      {contract.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderStatus(contract.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <div>
                        <span className="font-medium">Inicio:</span> {formatDate(contract.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">Fin:</span> {formatDate(contract.end_date)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col">
                      <div>
                        <span className="font-medium">Total:</span> {formatCurrency(contract.total_amount, contract.currency)}
                      </div>
                      <div>
                        <span className="font-medium">Restante:</span> {formatCurrency(contract.remaining_amount, contract.currency)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(contract)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(contract)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="p-4 border-t">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Modal para crear/editar/eliminar contratos */}
      <Modal 
        isOpen={showModal} 
        onClose={closeModal}
        title={
          modalType === 'create' ? 'Nuevo Contrato' : 
          modalType === 'edit' ? 'Editar Contrato' : 
          'Eliminar Contrato'
        }
      >
        {modalType === 'delete' ? (
          <div className="p-6">
            <p className="mb-4 text-gray-700">
              ¿Está seguro que desea eliminar el contrato {selectedContract?.contract_number}?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <ContractForm 
            contract={selectedContract} 
            onClose={handleCloseModalAndSync} 
            mode={modalType}
          />
        )}
      </Modal>
    </div>
  );
};

export default ContractTable;