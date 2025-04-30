import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Esquema de validación usando Yup
const contractSchema = yup.object().shape({
  contract_number: yup.string()
    .required('El número de contrato es obligatorio'),
  description: yup.string()
    .required('La descripción es obligatoria'),
  supplier: yup.string()
    .required('El proveedor es obligatorio'),
  status: yup.string()
    .required('El estado es obligatorio'),
  start_date: yup.string()
    .required('La fecha de inicio es obligatoria'),
  end_date: yup.string()
    .required('La fecha de fin es obligatoria')
    .test('is-after-start', 'La fecha de fin debe ser posterior a la fecha de inicio', 
      function(value) {
        const { start_date } = this.parent;
        if (!start_date || !value) return true;
        return new Date(value) > new Date(start_date);
      }),
  currency: yup.string()
    .required('La moneda es requerida'),
  total_amount: yup.number()
    .typeError('El monto debe ser un número')
    .required('El monto total es requerido')
    .min(0, 'El monto debe ser positivo'),
  remaining_amount: yup.number()
    .typeError('El monto debe ser un número')
    .required('El monto restante es requerido')
    .min(0, 'El monto restante no puede ser negativo')
    .test('is-less-than-total', 'El monto restante no puede ser mayor al monto total',
      function(value) {
        const { total_amount } = this.parent;
        if (!total_amount || !value) return true;
        return value <= total_amount;
      }),
  // Validación condicional para CAPEX - versión compatible
  cmf_code: yup.string()
    .test('cmf-required-for-capex', 'El código CMF es obligatorio para contratos CAPEX', 
      function(value) {
        const { opex_capex } = this.parent;
        // Solo validar si es CAPEX
        if (opex_capex === 'CAPEX') {
          return !!value; // Debe tener un valor
        }
        return true; // No es obligatorio para OPEX
      })
});

const ContractForm = ({ contract = null, onClose, mode = 'create' }) => {
  const { createContract, updateContract } = useContract();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // Para navegación por pestañas
  
  // Usar react-hook-form con validación yup
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(contractSchema),
    defaultValues: {
      contract_number: '',
      description: '',
      supplier: '',
      status: 'Active',
      start_date: '',
      end_date: '',
      currency: 'USD',
      total_amount: 0,
      remaining_amount: 0,
      opex_capex: 'OPEX',
      cmf_code: '',
    }
  });
  
  // Observar campos para lógica condicional
  const opexCapex = watch('opex_capex');
  const showCMFField = opexCapex === 'CAPEX';

  // Cargar datos del contrato si estamos en modo edición
  useEffect(() => {
    if (contract && mode === 'edit') {
      // Convertir fechas a formato yyyy-MM-dd para inputs date
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Preparar valores para el formulario
      const formValues = {
        // Campos básicos
        contract_number: contract.contract_number || '',
        description: contract.description || '',
        supplier: contract.supplier || '',
        status: contract.status || 'Active',
        start_date: formatDateForInput(contract.start_date),
        end_date: formatDateForInput(contract.end_date),
        currency: contract.currency || 'USD',
        total_amount: contract.total_amount || 0,
        remaining_amount: contract.remaining_amount || 0,
        
        // Campos SAP (solo visualización)
        sap_contract_number: contract.sap_contract_number || '',
        sap_description: contract.sap_description || '',
        sap_supplier: contract.sap_supplier || '',
        sap_start_date: formatDateForInput(contract.sap_start_date),
        sap_end_date: formatDateForInput(contract.sap_end_date),
        sap_currency: contract.sap_currency || '',
        sap_total_amount: contract.sap_total_amount || 0,
        sap_remaining_amount: contract.sap_remaining_amount || 0,
        sap_department: contract.sap_department || '',
        sap_category: contract.sap_category || '',
        
        // Datos K-S
        good_service: contract.good_service || '',
        site: contract.site || '',
        process_name: contract.process_name || '',
        supply_area_name: contract.supply_area_name || '',
        contract_type: contract.contract_type || 'Recurrente',
        opex_capex: contract.opex_capex || 'OPEX',
        contract_analyst: contract.contract_analyst || '',
        user_management: contract.user_management || '',
        category_n1_n2: contract.category_n1_n2 || '',
        
        // Campos U-Y
        contracting_type: contract.contracting_type || '',
        budget_usd: contract.budget_usd || 0,
        cmf_code: contract.cmf_code || '',
        planned_process_start_date: formatDateForInput(contract.planned_process_start_date),
        contract_signed_end_date: formatDateForInput(contract.contract_signed_end_date),
        
        // Hitos
        solped_budget_approved_date: formatDateForInput(contract.solped_budget_approved_date),
        strategy_committee_date: formatDateForInput(contract.strategy_committee_date),
        market_release_date: formatDateForInput(contract.market_release_date),
        queries_date: formatDateForInput(contract.queries_date),
        offers_reception_date: formatDateForInput(contract.offers_reception_date),
        technical_evaluation_date: formatDateForInput(contract.technical_evaluation_date),
        economic_evaluation_date: formatDateForInput(contract.economic_evaluation_date),
        negotiation_date: formatDateForInput(contract.negotiation_date),
        sc_committee_date: formatDateForInput(contract.sc_committee_date),
        site_committee_date: formatDateForInput(contract.site_committee_date),
        regional_committee_date: formatDateForInput(contract.regional_committee_date),
        global_committee_date: formatDateForInput(contract.global_committee_date),
        contract_signed_date: formatDateForInput(contract.contract_signed_date),
        kickoff_date: formatDateForInput(contract.kickoff_date),
        current_status: contract.current_status || '',
        comment: contract.comment || '',
        real_award_date: formatDateForInput(contract.real_award_date),
        tender_code: contract.tender_code || '',
        awarded_amount: contract.awarded_amount || 0,
        sap_contract_number_new: contract.sap_contract_number_new || '',
        new_contract_term_months: contract.new_contract_term_months || 0,
      };

      // Aplicar valores al formulario
      Object.entries(formValues).forEach(([name, value]) => {
        setValue(name, value);
      });
    }
  }, [contract, mode, setValue]);

  // Manejar envío del formulario
  const onSubmit = async (data) => {
    setFormError(null);
    setLoading(true);
    
    try {
      // Ejecutar la acción correspondiente según el modo
      if (mode === 'edit' && contract) {
        await updateContract(contract.id, data);
      } else {
        await createContract(data);
      }
      
      // Cerrar el formulario si todo salió bien
      onClose();
    } catch (error) {
      setFormError(error.message || 'Ha ocurrido un error al guardar el contrato');
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar mensajes de error
  const renderError = (fieldName) => {
    const error = errors[fieldName];
    if (!error) return null;
    
    // Asegurarse de que el mensaje sea una cadena
    const errorMessage = typeof error.message === 'string' 
      ? error.message 
      : 'Error de validación';
      
    return (
      <p className="mt-1 text-xs text-red-500">
        {errorMessage}
      </p>
    );
  };

  return (
    <div className="p-4">
      {formError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {formError}
        </div>
      )}
      
      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información Básica
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detalles del Proceso
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'milestones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Hitos y Fechas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('additional')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'additional'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información Adicional
          </button>
          {contract && (
            <button
              type="button"
              onClick={() => setActiveTab('sap')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sap'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Datos SAP
            </button>
          )}
        </nav>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Pestaña: Información Básica */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contract_number" className="block text-sm font-medium text-gray-700">
                  Número de Contrato*
                </label>
                <input
                  type="text"
                  id="contract_number"
                  {...register('contract_number')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.contract_number ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('contract_number')}
              </div>
              
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                  Proveedor*
                </label>
                <input
                  type="text"
                  id="supplier"
                  {...register('supplier')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.supplier ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('supplier')}
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción*
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows="3"
                className={`mt-1 block w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {renderError('description')}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio*
                </label>
                <input
                  type="date"
                  id="start_date"
                  {...register('start_date')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.start_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('start_date')}
              </div>
              
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Fin*
                </label>
                <input
                  type="date"
                  id="end_date"
                  {...register('end_date')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.end_date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('end_date')}
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado*
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.status ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="Active">Activo</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Closed">Cerrado</option>
                </select>
                {renderError('status')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Moneda*
                </label>
                <select
                  id="currency"
                  {...register('currency')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.currency ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CLP">CLP</option>
                </select>
                {renderError('currency')}
              </div>
              
              <div>
                <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                  Monto Total*
                </label>
                <input
                  type="number"
                  id="total_amount"
                  {...register('total_amount')}
                  step="0.01"
                  min="0"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.total_amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('total_amount')}
              </div>
              
              <div>
                <label htmlFor="remaining_amount" className="block text-sm font-medium text-gray-700">
                  Monto Restante*
                </label>
                <input
                  type="number"
                  id="remaining_amount"
                  {...register('remaining_amount')}
                  step="0.01"
                  min="0"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.remaining_amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('remaining_amount')}
              </div>
            </div>
          </div>
        )}
        
        {/* Pestaña: Detalles del Proceso */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="good_service" className="block text-sm font-medium text-gray-700">
                  Bien / Servicio
                </label>
                <input
                  type="text"
                  id="good_service"
                  {...register('good_service')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="site" className="block text-sm font-medium text-gray-700">
                  Sitio
                </label>
                <input
                  type="text"
                  id="site"
                  {...register('site')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="process_name" className="block text-sm font-medium text-gray-700">
                  Nombre Proceso
                </label>
                <input
                  type="text"
                  id="process_name"
                  {...register('process_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="supply_area_name" className="block text-sm font-medium text-gray-700">
                  Nombre de Área Supply
                </label>
                <input
                  type="text"
                  id="supply_area_name"
                  {...register('supply_area_name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Contrato
                </label>
                <select
                  id="contract_type"
                  {...register('contract_type')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Recurrente">Recurrente</option>
                  <option value="Spot">Spot</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="opex_capex" className="block text-sm font-medium text-gray-700">
                  OPEX / CAPEX
                </label>
                <select
                  id="opex_capex"
                  {...register('opex_capex')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OPEX">OPEX</option>
                  <option value="CAPEX">CAPEX</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="contract_analyst" className="block text-sm font-medium text-gray-700">
                  Analista de Contratos
                </label>
                <input
                  type="text"
                  id="contract_analyst"
                  {...register('contract_analyst')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user_management" className="block text-sm font-medium text-gray-700">
                  Gerencia Usuaria
                </label>
                <input
                  type="text"
                  id="user_management"
                  {...register('user_management')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="category_n1_n2" className="block text-sm font-medium text-gray-700">
                  Categoría (N1+N2)
                </label>
                <input
                  type="text"
                  id="category_n1_n2"
                  {...register('category_n1_n2')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Pestaña: Hitos y Fechas */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Fechas de Hitos del Proceso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="solped_budget_approved_date" className="block text-sm font-medium text-gray-700">
                  Solped con Budget Aprobado
                </label>
                <input
                  type="date"
                  id="solped_budget_approved_date"
                  {...register('solped_budget_approved_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="strategy_committee_date" className="block text-sm font-medium text-gray-700">
                  Comité de Estrategia
                </label>
                <input
                  type="date"
                  id="strategy_committee_date"
                  {...register('strategy_committee_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="market_release_date" className="block text-sm font-medium text-gray-700">
                  Salida a mercado
                </label>
                <input
                  type="date"
                  id="market_release_date"
                  {...register('market_release_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="queries_date" className="block text-sm font-medium text-gray-700">
                  Consultas
                </label>
                <input
                  type="date"
                  id="queries_date"
                  {...register('queries_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="offers_reception_date" className="block text-sm font-medium text-gray-700">
                  Recepción ofertas
                </label>
                <input
                  type="date"
                  id="offers_reception_date"
                  {...register('offers_reception_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="technical_evaluation_date" className="block text-sm font-medium text-gray-700">
                  Evaluación técnica
                </label>
                <input
                  type="date"
                  id="technical_evaluation_date"
                  {...register('technical_evaluation_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="economic_evaluation_date" className="block text-sm font-medium text-gray-700">
                  Evaluación económica
                </label>
                <input
                  type="date"
                  id="economic_evaluation_date"
                  {...register('economic_evaluation_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="negotiation_date" className="block text-sm font-medium text-gray-700">
                  Negociación
                </label>
                <input
                  type="date"
                  id="negotiation_date"
                  {...register('negotiation_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="sc_committee_date" className="block text-sm font-medium text-gray-700">
                  Comité SC
                </label>
                <input
                  type="date"
                  id="sc_committee_date"
                  {...register('sc_committee_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="site_committee_date" className="block text-sm font-medium text-gray-700">
                  Comité de sitio
                </label>
                <input
                  type="date"
                  id="site_committee_date"
                  {...register('site_committee_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="regional_committee_date" className="block text-sm font-medium text-gray-700">
                  Comité regional
                </label>
                <input
                  type="date"
                  id="regional_committee_date"
                  {...register('regional_committee_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="global_committee_date" className="block text-sm font-medium text-gray-700">
                  Comité global
                </label>
                <input
                  type="date"
                  id="global_committee_date"
                  {...register('global_committee_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contract_signed_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Adjudicación (Contrato firmado)
                </label>
                <input
                  type="date"
                  id="contract_signed_date"
                  {...register('contract_signed_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="kickoff_date" className="block text-sm font-medium text-gray-700">
                  Kickoff
                </label>
                <input
                  type="date"
                  id="kickoff_date"
                  {...register('kickoff_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="current_status" className="block text-sm font-medium text-gray-700">
                  Estatus Actual
                </label>
                <input
                  type="text"
                  id="current_status"
                  {...register('current_status')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                Comentario
              </label>
              <textarea
                id="comment"
                {...register('comment')}
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
        
        {/* Pestaña: Información Adicional */}
        {activeTab === 'additional' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contracting_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Contratación
                </label>
                <input
                  type="text"
                  id="contracting_type"
                  {...register('contracting_type')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="budget_usd" className="block text-sm font-medium text-gray-700">
                  Budget (USD) Informado por Finanzas
                </label>
                <input
                  type="number"
                  id="budget_usd"
                  {...register('budget_usd')}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {showCMFField && (
              <div>
                <label htmlFor="cmf_code" className="block text-sm font-medium text-gray-700">
                  Código Interno Planificación (CMF) *
                </label>
                <input
                  type="text"
                  id="cmf_code"
                  {...register('cmf_code')}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.cmf_code ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {renderError('cmf_code')}
                <p className="mt-1 text-xs text-gray-500">Este campo es obligatorio para contratos CAPEX</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="planned_process_start_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio del Proceso (Planificado)
                </label>
                <input
                  type="date"
                  id="planned_process_start_date"
                  {...register('planned_process_start_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="contract_signed_end_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Fin "11.Finalizado (Contrato Firmado)"
                </label>
                <input
                  type="date"
                  id="contract_signed_end_date"
                  {...register('contract_signed_end_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="real_award_date" className="block text-sm font-medium text-gray-700">
                  Fecha Adjudicación Real
                </label>
                <input
                  type="date"
                  id="real_award_date"
                  {...register('real_award_date')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="tender_code" className="block text-sm font-medium text-gray-700">
                  Código Licitación
                </label>
                <input
                  type="text"
                  id="tender_code"
                  {...register('tender_code')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="awarded_amount" className="block text-sm font-medium text-gray-700">
                  Monto Adjudicado
                </label>
                <input
                  type="number"
                  id="awarded_amount"
                  {...register('awarded_amount')}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sap_contract_number_new" className="block text-sm font-medium text-gray-700">
                  Número de Contrato en SAP
                </label>
                <input
                  type="text"
                  id="sap_contract_number_new"
                  {...register('sap_contract_number_new')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="new_contract_term_months" className="block text-sm font-medium text-gray-700">
                  Plazo del nuevo contrato (meses)
                </label>
                <input
                  type="number"
                  id="new_contract_term_months"
                  {...register('new_contract_term_months')}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Pestaña: Datos SAP (Solo Lectura) */}
        {activeTab === 'sap' && contract && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 mb-4 rounded-md">
              <p className="text-sm text-gray-700">
                Esta sección muestra los datos importados desde SAP. Estos campos no son editables.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de Contrato (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_contract_number') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Proveedor (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_supplier') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción (SAP)
              </label>
              <textarea
                value={watch('sap_description') || ''}
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                disabled
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_start_date') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fin (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_end_date') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Moneda (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_currency') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monto Total (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_total_amount') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Monto Restante (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_remaining_amount') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Departamento (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_department') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoría (SAP)
                </label>
                <input
                  type="text"
                  value={watch('sap_category') || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700"
                  disabled
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;