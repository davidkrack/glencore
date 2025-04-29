import React, { useState, useEffect } from 'react';
import { useContract } from '../../context/ContractContext';

const ContractForm = ({ contract = null, onClose, mode = 'create' }) => {
  const { createContract, updateContract } = useContract();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // Para navegación por pestañas
  
  // Estado para controlar campos relacionados (validaciones contextuales)
  const [showCMFField, setShowCMFField] = useState(false);
  
  // Inicializar el formulario con valores por defecto o del contrato existente
  const [formData, setFormData] = useState({
    // Campos básicos originales
    contract_number: '',
    description: '',
    supplier: '',
    status: 'Active',
    start_date: '',
    end_date: '',
    currency: 'USD',
    total_amount: 0,
    remaining_amount: 0,
    
    // Campos SAP (A-J) - Solo visualización, no editables
    sap_contract_number: '',
    sap_description: '',
    sap_supplier: '',
    sap_start_date: '',
    sap_end_date: '',
    sap_currency: '',
    sap_total_amount: 0,
    sap_remaining_amount: 0,
    sap_department: '',
    sap_category: '',
    
    // Datos analistas (K-S)
    good_service: '',
    site: '',
    process_name: '',
    supply_area_name: '',
    contract_type: 'Recurrente', // Recurrente / Spot
    opex_capex: 'OPEX',
    contract_analyst: '',
    user_management: '',
    category_n1_n2: '',
    
    // Campos U-Y
    contracting_type: '',
    budget_usd: 0,
    cmf_code: '',
    planned_process_start_date: '',
    contract_signed_end_date: '',
    
    // Campos AA-AU - Fechas de hitos
    solped_budget_approved_date: '',
    strategy_committee_date: '',
    market_release_date: '',
    queries_date: '',
    offers_reception_date: '',
    technical_evaluation_date: '',
    economic_evaluation_date: '',
    negotiation_date: '',
    sc_committee_date: '',
    site_committee_date: '',
    regional_committee_date: '',
    global_committee_date: '',
    contract_signed_date: '',
    kickoff_date: '',
    current_status: '',
    comment: '',
    real_award_date: '',
    tender_code: '',
    awarded_amount: 0,
    sap_contract_number_new: '',
    new_contract_term_months: 0,
  });

  // Cargar datos del contrato si estamos en modo edición
  useEffect(() => {
    if (contract && mode === 'edit') {
      // Convertir fechas a formato yyyy-MM-dd para inputs date
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Preparar objeto con valores formateados
      const initialData = {
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
        
        // Campos AA-AU
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

      setFormData(initialData);
      
      // Inicializar validaciones condicionales
      setShowCMFField(contract.opex_capex === 'CAPEX');
    }
  }, [contract, mode]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convertir a número si el campo es numérico
    if (type === 'number') {
      setFormData({ ...formData, [name]: value === '' ? '' : Number(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Lógica para mostrar/ocultar campos según contexto
    if (name === 'opex_capex') {
      setShowCMFField(value === 'CAPEX');
    }
  };

  // Validar formulario
  const validateForm = () => {
    // Validaciones básicas
    if (!formData.contract_number.trim()) {
      setFormError('El número de contrato es obligatorio');
      return false;
    }
    if (!formData.description.trim()) {
      setFormError('La descripción es obligatoria');
      return false;
    }
    if (!formData.supplier.trim()) {
      setFormError('El proveedor es obligatorio');
      return false;
    }
    if (!formData.start_date) {
      setFormError('La fecha de inicio es obligatoria');
      return false;
    }
    if (!formData.end_date) {
      setFormError('La fecha de fin es obligatoria');
      return false;
    }
    
    // Validar fechas
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }
    
    // Validar montos
    if (formData.total_amount < 0) {
      setFormError('El monto total no puede ser negativo');
      return false;
    }
    if (formData.remaining_amount < 0) {
      setFormError('El monto restante no puede ser negativo');
      return false;
    }
    if (formData.remaining_amount > formData.total_amount) {
      setFormError('El monto restante no puede ser mayor al monto total');
      return false;
    }
    
    // Validaciones contextuales
    if (formData.opex_capex === 'CAPEX' && !formData.cmf_code) {
      setFormError('El código CMF es obligatorio para contratos CAPEX');
      setActiveTab('additional'); // Cambiar a la pestaña donde está el campo
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Calcular campos automáticos antes de enviar
      const dataToSend = {
        ...formData,
        // Calcular alertas y porcentajes aquí si es necesario
      };
      
      // Crear o actualizar el contrato según el modo
      if (mode === 'edit' && contract) {
        await updateContract(contract.id, dataToSend);
      } else {
        await createContract(dataToSend);
      }
      
      // Cerrar el formulario si todo salió bien
      onClose();
    } catch (error) {
      setFormError(error.message || 'Ha ocurrido un error al guardar el contrato');
    } finally {
      setLoading(false);
    }
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
                  name="contract_number"
                  value={formData.contract_number}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
                  Proveedor*
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio*
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  Fecha de Fin*
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado*
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Active">Activo</option>
                  <option value="Pending">Pendiente</option>
                  <option value="Closed">Cerrado</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Moneda*
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CLP">CLP</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
                  Monto Total*
                </label>
                <input
                  type="number"
                  id="total_amount"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="remaining_amount" className="block text-sm font-medium text-gray-700">
                  Monto Restante*
                </label>
                <input
                  type="number"
                  id="remaining_amount"
                  name="remaining_amount"
                  value={formData.remaining_amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max={formData.total_amount}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
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
                  name="good_service"
                  value={formData.good_service}
                  onChange={handleChange}
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
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
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
                  name="process_name"
                  value={formData.process_name}
                  onChange={handleChange}
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
                  name="supply_area_name"
                  value={formData.supply_area_name}
                  onChange={handleChange}
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
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleChange}
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
                  name="opex_capex"
                  value={formData.opex_capex}
                  onChange={handleChange}
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
                  name="contract_analyst"
                  value={formData.contract_analyst}
                  onChange={handleChange}
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
                  name="user_management"
                  value={formData.user_management}
                  onChange={handleChange}
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
                  name="category_n1_n2"
                  value={formData.category_n1_n2}
                  onChange={handleChange}
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
                  name="solped_budget_approved_date"
                  value={formData.solped_budget_approved_date}
                  onChange={handleChange}
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
                  name="strategy_committee_date"
                  value={formData.strategy_committee_date}
                  onChange={handleChange}
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
                  name="market_release_date"
                  value={formData.market_release_date}
                  onChange={handleChange}
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
                  name="queries_date"
                  value={formData.queries_date}
                  onChange={handleChange}
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
                  name="offers_reception_date"
                  value={formData.offers_reception_date}
                  onChange={handleChange}
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
                  name="technical_evaluation_date"
                  value={formData.technical_evaluation_date}
                  onChange={handleChange}
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
                  name="economic_evaluation_date"
                  value={formData.economic_evaluation_date}
                  onChange={handleChange}
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
                  name="negotiation_date"
                  value={formData.negotiation_date}
                  onChange={handleChange}
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
                  name="sc_committee_date"
                  value={formData.sc_committee_date}
                  onChange={handleChange}
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
                  name="site_committee_date"
                  value={formData.site_committee_date}
                  onChange={handleChange}
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
                  name="regional_committee_date"
                  value={formData.regional_committee_date}
                  onChange={handleChange}
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
                  name="global_committee_date"
                  value={formData.global_committee_date}
                  onChange={handleChange}
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
                  name="contract_signed_date"
                  value={formData.contract_signed_date}
                  onChange={handleChange}
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
                  name="kickoff_date"
                  value={formData.kickoff_date}
                  onChange={handleChange}
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
                  name="current_status"
                  value={formData.current_status}
                  onChange={handleChange}
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
                name="comment"
                value={formData.comment}
                onChange={handleChange}
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
                  name="contracting_type"
                  value={formData.contracting_type}
                  onChange={handleChange}
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
                  name="budget_usd"
                  value={formData.budget_usd}
                  onChange={handleChange}
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
                  name="cmf_code"
                  value={formData.cmf_code}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={formData.opex_capex === 'CAPEX'}
                />
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
                  name="planned_process_start_date"
                  value={formData.planned_process_start_date}
                  onChange={handleChange}
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
                  name="contract_signed_end_date"
                  value={formData.contract_signed_end_date}
                  onChange={handleChange}
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
                  name="real_award_date"
                  value={formData.real_award_date}
                  onChange={handleChange}
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
                  name="tender_code"
                  value={formData.tender_code}
                  onChange={handleChange}
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
                  name="awarded_amount"
                  value={formData.awarded_amount}
                  onChange={handleChange}
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
                  name="sap_contract_number_new"
                  value={formData.sap_contract_number_new}
                  onChange={handleChange}
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
                  name="new_contract_term_months"
                  value={formData.new_contract_term_months}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Pestaña: Datos SAP (Solo Lectura) */}
        {activeTab === 'sap' && (
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
                  value={formData.sap_contract_number}
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
                  value={formData.sap_supplier}
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
                value={formData.sap_description}
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
                  value={formData.sap_start_date ? new Date(formData.sap_start_date).toLocaleDateString() : ''}
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
                  value={formData.sap_end_date ? new Date(formData.sap_end_date).toLocaleDateString() : ''}
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
                  value={formData.sap_currency}
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
                  value={formData.sap_total_amount ? formData.sap_total_amount.toLocaleString('es-CL', {style: 'currency', currency: formData.sap_currency || 'USD'}) : ''}
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
                  value={formData.sap_remaining_amount ? formData.sap_remaining_amount.toLocaleString('es-CL', {style: 'currency', currency: formData.sap_currency || 'USD'}) : ''}
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
                  value={formData.sap_department}
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
                  value={formData.sap_category}
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