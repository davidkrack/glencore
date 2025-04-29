from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import os
from typing import Dict, Any

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

@router.post("/sync-from", status_code=status.HTTP_200_OK)
async def sync_from_sharepoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza datos desde el Excel en SharePoint a la base de datos
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
            # Inicializar servicio de enlace directo
            sharepoint_service = SharePointDirectService()
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
        
        # Sincronizar desde SharePoint
        result = sharepoint_service.sync_from_sharepoint(db, current_user.id)
        
        return {
            "message": f"Sincronización exitosa desde SharePoint. {result.get('contracts_imported', 0)} contratos importados."
        }
    
    except Exception as e:
        print(f"Error en sincronización: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la sincronización: {str(e)}"
        )

@router.post("/sync-to", status_code=status.HTTP_200_OK)
async def sync_to_sharepoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza datos desde la base de datos al Excel en SharePoint
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
            # Inicializar servicio de enlace directo
            sharepoint_service = SharePointDirectService()
            
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

@router.post("/settings", status_code=status.HTTP_200_OK)
async def update_sharepoint_settings(
    settings_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza la configuración de SharePoint (simulado)
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción"
        )
    
    # En un entorno real, aquí actualizaríamos las variables de entorno
    # o una configuración en base de datos. Para este ejemplo, solo simulamos.
    
    print(f"Configuración recibida para actualizar: {settings_data}")
    
    return {
        "message": "Configuración actualizada con éxito (simulación)",
        "settings": settings_data
    }