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
    category = Column(String)
    subcategory = Column(String)
    department = Column(String)
    notes = Column(Text, nullable=True)
    
    # Campo para almacenar datos adicionales específicos del Excel
    additional_data = Column(Text, nullable=True)  # JSON serializado para campos extras
    
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