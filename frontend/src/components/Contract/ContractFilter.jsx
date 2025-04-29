import React from 'react';
import { useContract } from '../../context/ContractContext';

const ContractFilter = () => {
  const { filter, setFilter } = useContract();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilter({
      search: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Limpiar filtros
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-xs font-medium text-gray-500">
            Buscar
          </label>
          <input
            type="text"
            id="search"
            name="search"
            value={filter.search}
            onChange={handleChange}
            placeholder="Número, descripción, proveedor..."
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-500">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={filter.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="Active">Activo</option>
            <option value="Pending">Pendiente</option>
            <option value="Closed">Cerrado</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="dateFrom" className="block text-xs font-medium text-gray-500">
            Fecha desde
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={filter.dateFrom}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="dateTo" className="block text-xs font-medium text-gray-500">
            Fecha hasta
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={filter.dateTo}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ContractFilter;