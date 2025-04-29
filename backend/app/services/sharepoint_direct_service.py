"""
Servicio para la integración con SharePoint usando un enlace directo compartido
"""
import os
import tempfile
import requests
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from app.services.excel_service import import_from_excel, export_to_excel

class SharePointDirectService:
    """
    Servicio para interactuar con Excel compartido en SharePoint mediante enlace directo
    """
    
    def __init__(self):
        """Inicializa el servicio con la configuración del enlace compartido"""
        # Obtener el enlace compartido de las variables de entorno
        self.shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
        print(f"SharePointDirectService inicializado con enlace: {self.shared_link}")
        
        # Convertir el enlace compartido a un enlace directo de descarga
        # Esto es necesario porque el enlace compartido original no siempre es un enlace de descarga directa
        self.download_link = self._convert_to_download_link(self.shared_link)
    
    def _convert_to_download_link(self, shared_link):
        """
        Convierte un enlace compartido de SharePoint en un enlace de descarga directa
        """
        if not shared_link:
            return ""
        
        # Imprimir para diagnóstico
        print(f"Convirtiendo enlace compartido: {shared_link}")
        
        # Esta es una solución simple - en algunos casos, el enlace compartido solo necesita
        # tener modificada la URL para descarga directa
        try:
            # Si el enlace ya contiene '?download=1', no hacer cambios
            if '?download=1' in shared_link:
                return shared_link
                
            # Si el enlace tiene parámetros (como ?e=xxx), reemplazar con download=1
            if '?' in shared_link:
                base_url = shared_link.split('?')[0]
                return f"{base_url}?download=1"
            
            # Si no tiene parámetros, añadir ?download=1
            return f"{shared_link}?download=1"
        except Exception as e:
            print(f"Error al convertir enlace: {str(e)}")
            # En caso de error, devolver el enlace original
            return shared_link
    
    def download_excel(self):
        """Descargar el archivo Excel desde el enlace compartido"""
        try:
            # Verificar que el enlace esté configurado
            if not self.download_link:
                raise Exception("No se ha configurado un enlace compartido de SharePoint")
                
            # Crear directorio temporal para almacenar el archivo
            temp_dir = Path("./temp")
            temp_dir.mkdir(exist_ok=True)
            
            # Nombre temporal para el archivo descargado
            temp_file = temp_dir / f"sourcing_plan_temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Descargar el archivo usando requests
            print(f"Descargando desde: {self.download_link}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
            response = requests.get(self.download_link, headers=headers, stream=True, allow_redirects=True)
            
            # Imprimir información de diagnóstico
            print(f"Código de estado: {response.status_code}")
            print(f"Encabezados de respuesta: {response.headers}")
            
            # Verificar que la descarga fue exitosa
            if response.status_code != 200:
                raise Exception(f"Error al descargar archivo. Código: {response.status_code}, Respuesta: {response.text[:200]}...")
            
            # Verificar tipo de contenido
            content_type = response.headers.get('Content-Type', '')
            print(f"Tipo de contenido: {content_type}")
            
            if 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' not in content_type and 'application/octet-stream' not in content_type:
                # Si no es Excel, probablemente sea HTML o un error
                print(f"Contenido no es Excel: {response.text[:500]}...")
                
                # Si es una redirección, intentar seguir manualmente
                if 'location' in response.headers:
                    redirect_url = response.headers['location']
                    print(f"Intentando redirección a: {redirect_url}")
                    redirect_response = requests.get(redirect_url, headers=headers, stream=True)
                    if redirect_response.status_code == 200:
                        response = redirect_response
                    else:
                        raise Exception(f"Error al seguir redirección. Código: {redirect_response.status_code}")
                else:
                    raise Exception(f"El enlace no devuelve un archivo Excel válido. Tipo de contenido: {content_type}")
            
            # Guardar el archivo descargado
            with open(temp_file, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"Archivo descargado exitosamente en: {temp_file}")
            return str(temp_file)
        except Exception as e:
            print(f"Error detallado al descargar archivo desde enlace compartido: {str(e)}")
            raise Exception(f"Error al descargar archivo desde enlace compartido: {str(e)}")
    
    def upload_excel(self, file_path):
        """
        Esta función simula la subida pero no puede subir directamente a través del enlace compartido.
        En su lugar, proporciona instrucciones para la subida manual.
        """
        try:
            # En este caso, no podemos subir directamente a través del enlace compartido
            # Pero podemos guardar una copia del archivo para que se pueda subir manualmente
            
            backup_dir = Path("./export")
            backup_dir.mkdir(exist_ok=True)
            export_file = backup_dir / f"sourcing_plan_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Copiar el archivo exportado a la carpeta de exportación
            import shutil
            shutil.copy2(file_path, export_file)
            
            print(f"Archivo exportado guardado en: {export_file}")
            print("Por favor, suba este archivo manualmente a SharePoint a través del enlace compartido.")
            
            return {
                "success": True,
                "message": f"Archivo exportado guardado localmente en {export_file}. Requiere subida manual a SharePoint.",
                "file_path": str(export_file)
            }
        except Exception as e:
            print(f"Error al preparar archivo para subida a SharePoint: {str(e)}")
            raise Exception(f"Error al preparar archivo para subida a SharePoint: {str(e)}")
    
    def sync_from_sharepoint(self, db: Session, user_id: int):
        """
        Sincroniza los datos desde el Excel compartido a la base de datos
        """
        try:
            # Descargar el archivo desde el enlace compartido
            excel_path = self.download_excel()
            
            # Importar datos a la base de datos
            result = import_from_excel(excel_path, db, user_id)
            
            # Limpiar el archivo temporal
            if os.path.exists(excel_path):
                os.remove(excel_path)
            
            return result
        except Exception as e:
            print(f"Error en la sincronización desde SharePoint (enlace directo): {str(e)}")
            raise Exception(f"Error en la sincronización desde SharePoint (enlace directo): {str(e)}")
    
    def sync_to_sharepoint(self, db: Session):
        """
        Exporta los datos a un Excel para subir manualmente a SharePoint
        """
        try:
            # Exportar datos a un archivo Excel temporal
            excel_path = export_to_excel(db)
            
            # Preparar el archivo para subida manual
            result = self.upload_excel(excel_path)
            
            # Conservamos el archivo para subida manual
            # No lo eliminamos como en el método original
            
            return result
        except Exception as e:
            print(f"Error en la preparación para sincronización hacia SharePoint: {str(e)}")
            raise Exception(f"Error en la preparación para sincronización hacia SharePoint: {str(e)}")

# Para uso de prueba y desarrollo
if __name__ == "__main__":
    print("Probando servicio de SharePoint con enlace directo...")
    service = SharePointDirectService()
    print(f"Configuración: {service.download_link}")
    print("Completado.")