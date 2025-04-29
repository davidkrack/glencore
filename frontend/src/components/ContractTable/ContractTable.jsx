import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import ContractRow from './ContractRow';
import { FaPlus, FaFileExcel, FaUpload, FaSync } from 'react-icons/fa';

const ContractTable = () => {
  const { 
    contracts, 
    loading, 
    error, 
    fetchContracts, 
    createContract, 
    importFromExcel, 
    exportToExcel 
  } = useContract();
  
  const [showNewContractForm, setShowNewContractForm] = useState(false);
  const [newContract, setNewContract] = useState({
    contract_number: '',
    description: '',
    supplier: '',
    status: 'Active',
    start_date: '',
    end_date: '',
    currency: 'USD',
    total_amount: 0,
    remaining_amount: 0,
    category: '',
    subcategory: '',
    department: '',
    notes: ''
  });
  const [fileInput, setFileInput] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContract({
      ...newContract,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createContract(newContract);
    setNewContract({
      contract_number: '',
      description: '',
      supplier: '',
      status: 'Active',
      start_date: '',
      end_date: '',
      currency: 'USD',
      total_amount: 0,
      remaining_amount: 0,
      category: '',
      subcategory: '',
      department: '',
      notes: ''
    });
    setShowNewContractForm(false);
  };

  const handleFileUpload = (e) => {
    setFileInput(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!fileInput) return;
    await importFromExcel(fileInput);
    setFileInput(null);
    // Limpiar el input file
    document.getElementById('file-upload').value = '';
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-bold text-gray-800">Contratos</div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowNewContractForm(!showNewContractForm)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaPlus className="mr-1" />
            Nuevo Contrato
          </button>
          
          <button 
            onClick={fetchContracts}
            className="flex items-center px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            <FaSync className="mr-1" />
            Actualizar
          </button>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaFileExcel className="mr-1" />
            Exportar Excel
          </button>
          
          <div className="flex">
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="w-40 text-sm"
            />
            <button 
              onClick={handleImport}
              disabled={!fileInput}
              className="flex items-center px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-orange-300"
            >
              <FaUpload className="mr-1" />
              Importar
            </button>
          </div>
        </div>
      </div>

      {/* Form for new contract */}
      {showNewContractForm && (
        <div className="p-4 bg-gray-100 border-b">
          <h3 className="font-bold mb-3">Nuevo Contrato</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Contrato</label>
              <input
                type="text"
                name="contract_number"
                value={newContract.contract_number}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                name="description"
                value={newContract.description}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Proveedor</label>
              <input
                type="text"
                name="supplier"
                value={newContract.supplier}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                name="status"
                value={newContract.status}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Active">Activo</option>
                <option value="Pending">Pendiente</option>
                <option value="Closed">Cerrado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                name="start_date"
                value={newContract.start_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                name="end_date"
                value={newContract.end_date}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Moneda</label>
              <select
                name="currency"
                value={newContract.currency}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CLP">CLP</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto Total</label>
              <input
                type="number"
                name="total_amount"
                value={newContract.total_amount}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto Restante</label>
              <input
                type="number"
                name="remaining_amount"
                value={newContract.remaining_amount}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="col-span-3 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewContractForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-100 border-b border-red-200 text-red-700">
          {error}
        </div>
      )}
      
      {/* Table */}
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
                Montos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No hay contratos disponibles
                </td>
              </tr>
            ) : (
              contracts.map(contract => (
                <ContractRow key={contract.id} contract={contract} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractTable;