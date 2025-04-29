from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class ContractBase(BaseModel):
    contract_number: str
    description: str
    supplier: str
    status: str
    start_date: date
    end_date: date
    currency: str = "USD"
    total_amount: float
    remaining_amount: float
    category: str
    subcategory: str
    department: str
    notes: Optional[str] = None
    additional_data: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
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

class ContractResponse(ContractBase):
    id: int
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Actualizado de orm_mode a from_attributes