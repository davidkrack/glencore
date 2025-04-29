import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import ContractFilter from './ContractFilter';
import ImportExportTools from './ImportExportTools';
import Modal from '../common/Modal';
import ContractForm from './ContractForm';

const ContractTable = () => {
  const { 
    filteredContracts, 
    loading, 
    error, 
    deleteContract 
  } = useContract();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
  const [selectedContract, setSelectedContract] = useState(null);

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
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
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
        </div>
      </div>

      <ContractFilter />
      <ImportExportTools />

      {error && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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
            ) : filteredContracts.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron contratos
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contract_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {contract.description}
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
            onClose={closeModal} 
            mode={modalType}
          />
        )}
      </Modal>
    </div>
  );
};

export default ContractTable;