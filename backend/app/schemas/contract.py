from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class ContractBase(BaseModel):
    # Campos básicos - todos opcionales para permitir registros parciales
    contract_number: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: Optional[str] = "USD"
    total_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    department: Optional[str] = None
    notes: Optional[str] = None
    additional_data: Optional[str] = None

    # Datos SAP
    sap_contract_number: Optional[str] = None
    sap_description: Optional[str] = None
    sap_supplier: Optional[str] = None
    sap_start_date: Optional[date] = None
    sap_end_date: Optional[date] = None
    sap_currency: Optional[str] = None
    sap_total_amount: Optional[float] = None
    sap_remaining_amount: Optional[float] = None
    sap_department: Optional[str] = None
    sap_category: Optional[str] = None
    
    # Datos llenados por analistas
    good_service: Optional[str] = None
    site: Optional[str] = None
    process_name: Optional[str] = None
    supply_area_name: Optional[str] = None
    contract_type: Optional[str] = None
    opex_capex: Optional[str] = None
    contract_analyst: Optional[str] = None
    user_management: Optional[str] = None
    category_n1_n2: Optional[str] = None
    
    # Campos adicionales
    contracting_type: Optional[str] = None
    budget_usd: Optional[float] = None
    cmf_code: Optional[str] = None
    planned_process_start_date: Optional[date] = None
    contract_signed_end_date: Optional[date] = None
    
    # Hitos y fechas
    solped_budget_approved_date: Optional[date] = None
    strategy_committee_date: Optional[date] = None
    market_release_date: Optional[date] = None
    queries_date: Optional[date] = None
    offers_reception_date: Optional[date] = None
    technical_evaluation_date: Optional[date] = None
    economic_evaluation_date: Optional[date] = None
    negotiation_date: Optional[date] = None
    sc_committee_date: Optional[date] = None
    site_committee_date: Optional[date] = None
    regional_committee_date: Optional[date] = None
    global_committee_date: Optional[date] = None
    contract_signed_date: Optional[date] = None
    kickoff_date: Optional[date] = None
    current_status: Optional[str] = None
    comment: Optional[str] = None
    real_award_date: Optional[date] = None
    tender_code: Optional[str] = None
    awarded_amount: Optional[float] = None
    sap_contract_number_new: Optional[str] = None
    new_contract_term_months: Optional[int] = None
    
    # Campos calculados
    renewal_alert: Optional[str] = None
    process_start_alert: Optional[str] = None
    progress_percentage: Optional[float] = None
    sla_duration: Optional[int] = None
    general_completeness: Optional[float] = None

class ContractCreate(ContractBase):
    # Solo estos campos son requeridos para la creación
    contract_number: str
    description: str
    supplier: str

class ContractUpdate(BaseModel):
    # Todos los campos opcionales para actualización
    contract_number: Optional[str] = None
    description: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    currency: Optional[str] = None
    total_amount: Optional[float] = None
    remaining_amount: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    department: Optional[str] = None
    notes: Optional[str] = None
    additional_data: Optional[str] = None

    # Campos de SAP
    sap_contract_number: Optional[str] = None
    sap_description: Optional[str] = None
    sap_supplier: Optional[str] = None
    sap_start_date: Optional[date] = None
    sap_end_date: Optional[date] = None
    sap_currency: Optional[str] = None
    sap_total_amount: Optional[float] = None
    sap_remaining_amount: Optional[float] = None
    sap_department: Optional[str] = None
    sap_category: Optional[str] = None
    
    # Datos analistas
    good_service: Optional[str] = None
    site: Optional[str] = None
    process_name: Optional[str] = None
    supply_area_name: Optional[str] = None
    contract_type: Optional[str] = None
    opex_capex: Optional[str] = None
    contract_analyst: Optional[str] = None
    user_management: Optional[str] = None
    category_n1_n2: Optional[str] = None
    
    # Campos adicionales
    contracting_type: Optional[str] = None
    budget_usd: Optional[float] = None
    cmf_code: Optional[str] = None
    planned_process_start_date: Optional[date] = None
    contract_signed_end_date: Optional[date] = None
    
    # Hitos y fechas
    solped_budget_approved_date: Optional[date] = None
    strategy_committee_date: Optional[date] = None
    market_release_date: Optional[date] = None
    queries_date: Optional[date] = None
    offers_reception_date: Optional[date] = None
    technical_evaluation_date: Optional[date] = None
    economic_evaluation_date: Optional[date] = None
    negotiation_date: Optional[date] = None
    sc_committee_date: Optional[date] = None
    site_committee_date: Optional[date] = None
    regional_committee_date: Optional[date] = None
    global_committee_date: Optional[date] = None
    contract_signed_date: Optional[date] = None
    kickoff_date: Optional[date] = None
    current_status: Optional[str] = None
    comment: Optional[str] = None
    real_award_date: Optional[date] = None
    tender_code: Optional[str] = None
    awarded_amount: Optional[float] = None
    sap_contract_number_new: Optional[str] = None
    new_contract_term_months: Optional[int] = None
    
    # Campos calculados
    renewal_alert: Optional[str] = None
    process_start_alert: Optional[str] = None
    progress_percentage: Optional[float] = None
    sla_duration: Optional[int] = None
    general_completeness: Optional[float] = None

class ContractResponse(ContractBase):
    id: int
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Actualizado de orm_mode a from_attributes