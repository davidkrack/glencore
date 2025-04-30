# backend/app/models/contract.py
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Información básica del contrato
    contract_number = Column(String, index=True, unique=True)
    description = Column(String)
    supplier = Column(String, index=True)
    status = Column(String)  # Active, Pending, Closed, etc.
    
    # Fechas importantes
    start_date = Column(Date)
    end_date = Column(Date)
    
    # Información financiera
    currency = Column(String, default="USD")
    total_amount = Column(Float)
    remaining_amount = Column(Float)
    
    # Información adicional
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    department = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Campo para almacenar datos adicionales específicos del Excel
    additional_data = Column(Text, nullable=True)  # JSON serializado para campos extras
    
    # Datos SAP (Columnas A-J)
    sap_contract_number = Column(String, nullable=True)
    sap_description = Column(String, nullable=True)
    sap_supplier = Column(String, nullable=True)
    sap_start_date = Column(Date, nullable=True)
    sap_end_date = Column(Date, nullable=True)
    sap_currency = Column(String, nullable=True)
    sap_total_amount = Column(Float, nullable=True)
    sap_remaining_amount = Column(Float, nullable=True)
    sap_department = Column(String, nullable=True)
    sap_category = Column(String, nullable=True)
    
    # Datos analistas (Columnas K-S)
    good_service = Column(String, nullable=True)
    site = Column(String, nullable=True)
    process_name = Column(String, nullable=True)
    supply_area_name = Column(String, nullable=True)
    contract_type = Column(String, nullable=True)  # Recurrente / Spot
    opex_capex = Column(String, nullable=True)  # OPEX / CAPEX
    contract_analyst = Column(String, nullable=True)
    user_management = Column(String, nullable=True)
    category_n1_n2 = Column(String, nullable=True)
    
    # Campos U-Y
    contracting_type = Column(String, nullable=True)
    budget_usd = Column(Float, nullable=True)
    cmf_code = Column(String, nullable=True)
    planned_process_start_date = Column(Date, nullable=True)
    contract_signed_end_date = Column(Date, nullable=True)
    
    # Hitos y fechas (Columnas AA-AU)
    solped_budget_approved_date = Column(Date, nullable=True)
    strategy_committee_date = Column(Date, nullable=True)
    market_release_date = Column(Date, nullable=True)
    queries_date = Column(Date, nullable=True)
    offers_reception_date = Column(Date, nullable=True)
    technical_evaluation_date = Column(Date, nullable=True)
    economic_evaluation_date = Column(Date, nullable=True)
    negotiation_date = Column(Date, nullable=True)
    sc_committee_date = Column(Date, nullable=True)
    site_committee_date = Column(Date, nullable=True)
    regional_committee_date = Column(Date, nullable=True)
    global_committee_date = Column(Date, nullable=True)
    contract_signed_date = Column(Date, nullable=True)
    kickoff_date = Column(Date, nullable=True)
    current_status = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    real_award_date = Column(Date, nullable=True)
    tender_code = Column(String, nullable=True)
    awarded_amount = Column(Float, nullable=True)
    sap_contract_number_new = Column(String, nullable=True)
    new_contract_term_months = Column(Integer, nullable=True)
    
    # Campos calculados automáticamente - AÑADIR ESTOS CAMPOS
    renewal_alert = Column(String, nullable=True)
    process_start_alert = Column(String, nullable=True)
    progress_percentage = Column(Float, nullable=True)
    sla_duration = Column(Integer, nullable=True)
    general_completeness = Column(Float, nullable=True)
    
    # Auditoría
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_contracts")
    updater = relationship("User", foreign_keys=[updated_by], back_populates="updated_contracts")

class ContractHistory(Base):
    __tablename__ = "contract_history"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime, default=datetime.utcnow)
    field_name = Column(String)
    old_value = Column(String)
    new_value = Column(String)
    
    # Relaciones
    contract = relationship("Contract")
    user = relationship("User")