from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.services.excel_service import import_from_excel, export_to_excel
from app.core.security import get_current_user
from starlette.background import BackgroundTask  # Importación corregida
import tempfile
import os
import time
import pandas as pd

router = APIRouter(
    prefix="/excel",
    tags=["excel"],
)

@router.post("/import", status_code=status.HTTP_200_OK)
async def import_excel(
    file: UploadFile = File(...),
    sheet_name: str = "Sourcing Plan",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos de Excel (.xlsx, .xls)"
        )
    
    temp_file = None
    try:
        # Guardar el archivo temporalmente
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        contents = await file.read()
        with open(temp_file.name, 'wb') as f:
            f.write(contents)
        
        # Importar datos desde Excel
        result = import_from_excel(temp_file.name, db, current_user.id, sheet_name=sheet_name)
        
        return {"message": f"Importación exitosa: {result['contracts_imported']} contratos importados"}
    
    except Exception as e:
        # Capturar errores específicos
        error_msg = str(e)
        if "invalid keyword argument" in error_msg:
            error_msg = "Error en el modelo: campo no existe en la base de datos. Contacte al administrador."
        elif "Date" in error_msg and "outside the limits" in error_msg:
            error_msg = "El Excel contiene fechas inválidas. Revise los valores de fechas y montos en el archivo."
        
        raise HTTPException(status_code=500, detail=f"Error al importar: {error_msg}")
    
    finally:
        # Asegurarse de eliminar el archivo temporal
        if temp_file:
            try:
                # Esperar un momento para asegurarse de que el archivo no esté en uso
                time.sleep(0.5)
                os.unlink(temp_file.name)
            except PermissionError:
                # Si está en uso, programar eliminación posterior - no es crítico
                print(f"No se pudo eliminar el archivo temporal: {temp_file.name}")
            except Exception as e:
                print(f"Error al eliminar archivo temporal: {e}")

@router.post("/list-sheets", status_code=status.HTTP_200_OK)
async def list_excel_sheets(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos de Excel (.xlsx, .xls)"
        )
    
    temp_file = None
    try:
        # Guardar el archivo temporalmente
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        contents = await file.read()
        with open(temp_file.name, 'wb') as f:
            f.write(contents)
        
        # Obtener todas las hojas
        excel_file = pd.ExcelFile(temp_file.name)
        sheet_names = excel_file.sheet_names
        
        return {
            "sheet_names": sheet_names,
            "total_sheets": len(sheet_names)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer hojas: {str(e)}")
    
    finally:
        if temp_file:
            try:
                os.unlink(temp_file.name)
            except:
                pass

@router.get("/export")
def export_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Exportar datos a Excel
        temp_file = export_to_excel(db)
        
        def cleanup_temp_file(file_path):
            try:
                # Esperar un momento para asegurarse de que el archivo no esté en uso
                time.sleep(1)
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception as e:
                print(f"Error al eliminar archivo temporal: {e}")
        
        return FileResponse(
            path=temp_file,
            filename="sourcing_plan_export.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            background=BackgroundTask(lambda: cleanup_temp_file(temp_file))
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al exportar: {str(e)}")