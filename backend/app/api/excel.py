from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.excel_service import import_from_excel, export_to_excel
from app.core.security import get_current_user
import tempfile
import os

router = APIRouter(
    prefix="/excel",
    tags=["excel"],
)

@router.post("/import", status_code=status.HTTP_200_OK)
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos de Excel (.xlsx, .xls)"
        )
    
    try:
        # Guardar el archivo temporalmente
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        contents = await file.read()
        with open(temp_file.name, 'wb') as f:
            f.write(contents)
        
        # Importar datos desde Excel
        result = import_from_excel(temp_file.name, db, current_user.id)
        
        # Eliminar archivo temporal
        os.unlink(temp_file.name)
        
        return {"message": f"Importación exitosa: {result['contracts_imported']} contratos importados"}
    
    except Exception as e:
        # Asegurarse de eliminar el archivo temporal en caso de error
        if 'temp_file' in locals():
            os.unlink(temp_file.name)
        raise HTTPException(status_code=500, detail=f"Error al importar: {str(e)}")

@router.get("/export")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Exportar datos a Excel
        temp_file = export_to_excel(db)
        
        return FileResponse(
            path=temp_file,
            filename="sourcing_plan_export.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al exportar: {str(e)}")