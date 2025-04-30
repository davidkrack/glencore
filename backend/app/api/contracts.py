from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.contract import ContractCreate, ContractUpdate, ContractResponse
from app.models.contract import Contract
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from datetime import datetime

router = APIRouter(
    prefix="/contracts",
    tags=["contracts"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[ContractResponse])
def read_contracts(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contracts = db.query(Contract).offset(skip).limit(limit).all()
        return contracts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al recuperar contratos: {str(e)}"
        )

@router.post("/", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract: ContractCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_contract = Contract(**contract.dict(), created_by=current_user.id, updated_by=current_user.id)
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.get("/{contract_id}", response_model=ContractResponse)
def read_contract(
    contract_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if db_contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db_contract

@router.put("/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int, 
    contract: ContractUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if db_contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Actualizar solo los campos proporcionados
    update_data = contract.dict(exclude_unset=True)
    update_data["updated_by"] = current_user.id
    update_data["updated_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_contract, key, value)
    
    db.commit()
    db.refresh(db_contract)
    return db_contract

@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    db_contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if db_contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    db.delete(db_contract)
    db.commit()
    return None