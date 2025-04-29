"""
Servicio para la integración con SharePoint usando Office365-REST-Python-Client
"""
import os
import tempfile
from pathlib import Path
from datetime import datetime
import json
from sqlalchemy.orm import Session
from app.services.excel_service import import_from_excel, export_to_excel

# Intentar importar Office365-REST-Python-Client si está instalado
try:
    from office365.runtime.auth.authentication_context import AuthenticationContext
    from office365.sharepoint.client_context import ClientContext
    SHAREPOINT_AVAILABLE = True
except ImportError:
    SHAREPOINT_AVAILABLE = False
    print("WARNING: Office365-REST-Python-Client no está instalado. La integración con SharePoint no estará disponible.")

class SharePointService:
    """
    Servicio para interactuar con SharePoint y sincronizar datos con Excel
    """
    
    def __init__(self):
        """Inicializa el servicio con la configuración de SharePoint"""
        # En un entorno real, obtendríamos estos valores de settings
        self.site_url = os.getenv("SHAREPOINT_SITE_URL", "")
        self.username = os.getenv("SHAREPOINT_USERNAME", "")
        self.password = os.getenv("SHAREPOINT_PASSWORD", "")
        self.excel_relative_path = os.getenv("SHAREPOINT_EXCEL_PATH", "")
        self.ctx = None
        
    def _authenticate(self):
        """Autenticar con SharePoint"""
        if not SHAREPOINT_AVAILABLE:
            return False
            
        try:
            auth_context = AuthenticationContext(self.site_url)
            auth_context.acquire_token_for_user(self.username, self.password)
            self.ctx = ClientContext(self.site_url, auth_context)
            return True
        except Exception as e:
            print(f"Error al autenticar con SharePoint: {str(e)}")
            return False
    
    def download_excel(self):
        """Descargar el archivo Excel desde SharePoint"""
        if not SHAREPOINT_AVAILABLE:
            raise Exception("La integración con SharePoint no está disponible. Instale Office365-REST-Python-Client.")
            
        if not self._authenticate():
            raise Exception("No se pudo autenticar con SharePoint")
        
        try:
            # Crear directorio temporal para almacenar el archivo
            temp_dir = Path("./temp")
            temp_dir.mkdir(exist_ok=True)
            
            # Nombre temporal para el archivo descargado
            temp_file = temp_dir / f"sourcing_plan_temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Descargar el archivo
            with open(temp_file, "wb") as local_file:
                file = self.ctx.web.get_file_by_server_relative_url(self.excel_relative_path)
                file.download(local_file).execute_query()
            
            return str(temp_file)
        except Exception as e:
            raise Exception(f"Error al descargar archivo de SharePoint: {str(e)}")
    
    def upload_excel(self, file_path):
        """Subir el archivo Excel a SharePoint"""
        if not SHAREPOINT_AVAILABLE:
            raise Exception("La integración con SharePoint no está disponible. Instale Office365-REST-Python-Client.")
            
        if not self._authenticate():
            raise Exception("No se pudo autenticar con SharePoint")
        
        try:
            # Leer el archivo a subir
            with open(file_path, 'rb') as content_file:
                file_content = content_file.read()
            
            # Subir el archivo
            target_folder = os.path.dirname(self.excel_relative_path)
            file_name = os.path.basename(self.excel_relative_path)
            
            target_folder = self.ctx.web.get_folder_by_server_relative_url(target_folder)
            target_file = target_folder.upload_file(file_name, file_content).execute_query()
            
            return True
        except Exception as e:
            raise Exception(f"Error al subir archivo a SharePoint: {str(e)}")
    
    def sync_from_sharepoint(self, db: Session, user_id: int):
        """
        Sincroniza los datos desde el Excel de SharePoint a la base de datos
        """
        if not SHAREPOINT_AVAILABLE:
            # Modo simulación para desarrollo/pruebas
            print("Usando modo simulación (SharePoint no disponible)")
            return {"contracts_imported": 0, "message": "Simulación de importación completada"}
            
        try:
            # Descargar el archivo de SharePoint
            excel_path = self.download_excel()
            
            # Importar datos a la base de datos
            result = import_from_excel(excel_path, db, user_id)
            
            # Limpiar el archivo temporal
            if os.path.exists(excel_path):
                os.remove(excel_path)
            
            return result
        except Exception as e:
            raise Exception(f"Error en la sincronización desde SharePoint: {str(e)}")
    
    def sync_to_sharepoint(self, db: Session):
        """
        Sincroniza los datos desde la base de datos al Excel en SharePoint
        """
        if not SHAREPOINT_AVAILABLE:
            # Modo simulación para desarrollo/pruebas
            print("Usando modo simulación (SharePoint no disponible)")
            return {"message": "Simulación de exportación completada"}
            
        try:
            # Exportar datos a un archivo Excel temporal
            excel_path = export_to_excel(db)
            
            # Subir el archivo a SharePoint
            result = self.upload_excel(excel_path)
            
            # Limpiar el archivo temporal
            if os.path.exists(excel_path):
                os.remove(excel_path)
            
            return result
        except Exception as e:
            raise Exception(f"Error en la sincronización hacia SharePoint: {str(e)}")

# Para uso de prueba y desarrollo
if __name__ == "__main__":
    print("Probando servicio de SharePoint...")
    service = SharePointService()
    print(f"Configuración: {service.site_url}, {service.excel_relative_path}")
    print("Completado.")