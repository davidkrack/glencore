from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import os
from typing import Dict, Any
import json
import time

# Define BASE_DIR as the application root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Verificar si la biblioteca Office365 está disponible
try:
    from office365.runtime.auth.authentication_context import AuthenticationContext
    office365_available = True
except ImportError:
    office365_available = False

# Importar directamente el servicio de enlace directo
from app.services.sharepoint_direct_service import SharePointDirectService

router = APIRouter(
    prefix="/sharepoint",
    tags=["sharepoint"],
)

# Función de sincronización en segundo plano para evitar problemas con los archivos temporales
async def background_sync_from_sharepoint(db: Session, user_id: int):
    """Ejecuta la sincronización en segundo plano"""
    try:
        # Pequeña espera para permitir que el endpoint responda primero
        time.sleep(1)
        
        # Verificar si debemos usar el enlace directo
        shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
        
        if shared_link:
            print(f"Usando enlace compartido para sincronización: {shared_link}")
            # Inicializar servicio de enlace directo
            sharepoint_service = SharePointDirectService()
            
            # Sincronizar desde SharePoint
            result = sharepoint_service.sync_from_sharepoint(db, user_id)
            print(f"Sincronización en segundo plano completada: {result}")
            
        else:
            print("No hay enlace compartido configurado")
    except Exception as e:
        print(f"Error en sincronización en segundo plano: {str(e)}")

@router.post("/sync-from", status_code=status.HTTP_202_ACCEPTED)
async def sync_from_sharepoint(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza datos desde el Excel en SharePoint a la base de datos.
    Esta versión inicia la sincronización en segundo plano para evitar problemas con archivos bloqueados.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    
    try:
        # Verificar si está configurado el enlace compartido
        shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
        
        if not shared_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No hay un enlace compartido de SharePoint configurado"
            )
            
        # Ejecutar la sincronización en segundo plano para evitar problemas con archivos
        background_tasks.add_task(background_sync_from_sharepoint, db, current_user.id)
        
        return {
            "message": "Sincronización iniciada en segundo plano. El proceso puede tomar varios minutos."
        }
    
    except Exception as e:
        if "No hay un enlace compartido" in str(e):
            raise e  # Re-lanzar la excepción específica
            
        print(f"Error al iniciar sincronización: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al iniciar la sincronización: {str(e)}"
        )

@router.post("/sync-to", status_code=status.HTTP_200_OK)
async def sync_to_sharepoint(
    force_update: bool = Body(False, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza datos desde la base de datos al Excel en SharePoint
    
    Params:
    - force_update: Si es True, fuerza la actualización incluso si el archivo está bloqueado
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    
    try:
        # Verificar si debemos usar el enlace directo
        shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
        
        if shared_link:
            print(f"Usando enlace compartido para sincronización: {shared_link}")
            # Inicializar servicio de enlace directo con opción para forzar
            sharepoint_service = SharePointDirectService(force_update=force_update)
            
            # Mensaje especial para modo directo ya que requiere subida manual
            message_suffix = " Archivo preparado para subida manual."
        else:
            # Verificar credenciales tradicionales
            site_url = os.getenv("SHAREPOINT_SITE_URL", "")
            username = os.getenv("SHAREPOINT_USERNAME", "")
            password = os.getenv("SHAREPOINT_PASSWORD", "")
            
            if not site_url or not username or not password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Las credenciales de SharePoint no están configuradas"
                )
                
            if not office365_available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La biblioteca Office365-REST-Python-Client no está instalada. Use el enlace compartido o instale la biblioteca."
                )
                
            # Este punto no debería alcanzarse si no está disponible Office365
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El método de autenticación tradicional no está disponible actualmente. Use el enlace compartido."
            )
            
            message_suffix = ""
        
        # Sincronizar hacia SharePoint
        result = sharepoint_service.sync_to_sharepoint(db)
        
        # Mensaje personalizado según el resultado
        message = "Sincronización exitosa hacia SharePoint."
        if isinstance(result, dict) and "message" in result:
            message = result["message"]
        
        return {
            "message": message + message_suffix
        }
    
    except Exception as e:
        print(f"Error en sincronización: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la sincronización: {str(e)}"
        )

@router.get("/settings", response_model=Dict[str, Any])
async def get_sharepoint_settings(
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene la configuración actual de SharePoint
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    
    # Verificar si estamos usando enlace directo
    shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
    if shared_link:
        return {
            "shared_link": shared_link,
            "auto_sync_enabled": os.getenv("AUTO_SYNC_ENABLED", "False").lower() == "true",
            "auto_sync_interval_minutes": int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", "60"))
        }
    else:
        return {
            "site_url": os.getenv("SHAREPOINT_SITE_URL", ""),
            "username": os.getenv("SHAREPOINT_USERNAME", ""),
            "excel_path": os.getenv("SHAREPOINT_EXCEL_PATH", ""),
            "auto_sync_enabled": os.getenv("AUTO_SYNC_ENABLED", "False").lower() == "true",
            "auto_sync_interval_minutes": int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", "60"))
        }

def save_sharepoint_config(config_data):
    """Guarda la configuración de SharePoint en un archivo de configuración"""
    config_file = os.path.join(BASE_DIR, "config", "sharepoint_config.json")
    os.makedirs(os.path.dirname(config_file), exist_ok=True)
    
    # Actualizar las variables de entorno en tiempo de ejecución
    for key, value in config_data.items():
        env_key = f"SHAREPOINT_{key.upper()}" if not key.startswith("SHAREPOINT_") and key not in ["auto_sync_enabled", "auto_sync_interval_minutes"] else key
        os.environ[env_key] = str(value)
    
    # Guardar en archivo
    with open(config_file, 'w') as f:
        json.dump(config_data, f)

def load_sharepoint_config():
    """Carga la configuración de SharePoint desde un archivo"""
    config_file = os.path.join(BASE_DIR, "config", "sharepoint_config.json")
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            return json.load(f)
    return {}

@router.post("/settings", status_code=status.HTTP_200_OK)
async def update_sharepoint_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Actualiza la configuración de SharePoint"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No permitido")
    
    # Guardar en archivo de configuración
    save_sharepoint_config(settings_data)
    
    return {"message": "Configuración guardada exitosamente"}