import React, { useState } from 'react';
import { useContract } from '../../context/ContractContext';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import EditableCell from './EditableCell';

const ContractRow = ({ contract }) => {
  const { updateContract, deleteContract } = useContract();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContract, setEditedContract] = useState({ ...contract });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContract({ ...contract });
  };

  const handleSave = async () => {
    await updateContract(contract.id, editedContract);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('¿Está seguro de eliminar este contrato?')) {
      await deleteContract(contract.id);
    }
  };

  const handleChange = (field, value) => {
    setEditedContract({
      ...editedContract,
      [field]: value
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount, currency) => {
    if (amount === undefined || amount === null) return '';
    return `${currency} ${Number(amount).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <tr className={isEditing ? 'bg-blue-50' : ''}>
      {/* COLUMNA NÚMERO - Ahora muestra el número de contrato (SAP) */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <EditableCell
          value={editedContract.sap_contract_number || editedContract.contract_number}
          isEditing={isEditing}
          onChange={(value) => handleChange('contract_number', value)}
        />
      </td>
      
      {/* COLUMNA DESCRIPCIÓN - Ahora muestra el nombre del proceso */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <EditableCell
          value={editedContract.process_name || editedContract.description}
          isEditing={isEditing}
          onChange={(value) => handleChange('description', value)}
        />
      </td>
      
      {/* COLUMNA PROVEEDOR - Muestra el proveedor actual */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <EditableCell
          value={editedContract.supplier || editedContract.sap_supplier}
          isEditing={isEditing}
          onChange={(value) => handleChange('supplier', value)}
        />
      </td>
      
      {/* COLUMNA ESTADO - Muestra el estatus actual */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {isEditing ? (
          <select
            value={editedContract.current_status || editedContract.status || "Desconocido"}
            onChange={(e) => handleChange('current_status', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          >
            <option value="Active">Activo</option>
            <option value="Pending">Pendiente</option>
            <option value="Closed">Cerrado</option>
            <option value="Desconocido">Desconocido</option>
          </select>
        ) : (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            contract.current_status === 'Active' ? 'bg-green-100 text-green-800' :
            contract.current_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            contract.current_status === 'Closed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {contract.current_status || contract.status || "Desconocido"}
          </span>
        )}
      </td>
      
      {/* COLUMNA FECHAS - Muestra fechas de inicio y fin del proceso */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <div>
            <span className="font-medium">Inicio:</span>
            {isEditing ? (
              <input
                type="date"
                value={editedContract.planned_process_start_date ? editedContract.planned_process_start_date.split('T')[0] : ''}
                onChange={(e) => handleChange('planned_process_start_date', e.target.value)}
                className="ml-1 px-2 py-1 border rounded w-32"
              />
            ) : (
              <span className="ml-1">{formatDate(contract.planned_process_start_date) || formatDate(contract.start_date) || '-'}</span>
            )}
          </div>
          <div>
            <span className="font-medium">Fin:</span>
            {isEditing ? (
              <input
                type="date"
                value={editedContract.contract_signed_end_date ? editedContract.contract_signed_end_date.split('T')[0] : ''}
                onChange={(e) => handleChange('contract_signed_end_date', e.target.value)}
                className="ml-1 px-2 py-1 border rounded w-32"
              />
            ) : (
              <span className="ml-1">{formatDate(contract.contract_signed_end_date) || formatDate(contract.end_date) || '-'}</span>
            )}
          </div>
        </div>
      </td>
      
      {/* COLUMNA VALORES - Muestra montos totales y restantes */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex flex-col">
          <div>
            <span className="font-medium">Total:</span>
            {isEditing ? (
              <div className="flex items-center">
                <select
                  value={editedContract.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="ml-1 px-2 py-1 border rounded w-16"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CLP">CLP</option>
                </select>
                <input
                  type="number"
                  value={editedContract.total_amount}
                  onChange={(e) => handleChange('total_amount', e.target.value)}
                  className="ml-1 px-2 py-1 border rounded w-24"
                />
              </div>
            ) : (
              <span className="ml-1">{formatCurrency(contract.total_amount, contract.currency) || '-'}</span>
            )}
          </div>
          <div>
            <span className="font-medium">Restante:</span>
            {isEditing ? (
              <input
                type="number"
                value={editedContract.remaining_amount}
                onChange={(e) => handleChange('remaining_amount', e.target.value)}
                className="ml-1 px-2 py-1 border rounded w-24"
              />
            ) : (
              <span className="ml-1">{formatCurrency(contract.remaining_amount, contract.currency) || '-'}</span>
            )}
          </div>
        </div>
      </td>
      
      {/* COLUMNA ACCIONES */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                className="p-1 text-green-600 hover:text-green-900"
                title="Guardar"
              >
                <FaSave />
              </button>
              <button 
                onClick={handleCancel}
                className="p-1 text-gray-600 hover:text-gray-900"
                title="Cancelar"
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEdit}
                className="p-1 text-blue-600 hover:text-blue-900"
                title="Editar"
              >
                <FaEdit />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1 text-red-600 hover:text-red-900"
                title="Eliminar"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ContractRow;