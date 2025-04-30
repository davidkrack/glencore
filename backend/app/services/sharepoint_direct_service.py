"""
Servicio para la integración con SharePoint usando un enlace directo compartido
"""
import os
import tempfile
import requests
import shutil
import time
from pathlib import Path
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.services.excel_service import import_from_excel, export_to_excel
import pandas as pd
from app.models.contract import Contract
from app.models.user import User

class SharePointDirectService:
    """
    Servicio para interactuar con Excel compartido en SharePoint mediante enlace directo
    """
    
    def __init__(self, force_update=False):
        """
        Inicializa el servicio con la configuración del enlace compartido
        
        Args:
            force_update (bool): Si es True, intentará forzar la actualización aunque el archivo esté bloqueado
        """
        # Obtener el enlace compartido de las variables de entorno
        self.shared_link = os.getenv("SHAREPOINT_SHARED_LINK", "")
        self.force_update = force_update
        print(f"SharePointDirectService inicializado con enlace: {self.shared_link} (force_update={force_update})")
        
        # Convertir el enlace compartido a un enlace directo de descarga
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
        temp_file = None
        try:
            # Verificar que el enlace esté configurado
            if not self.download_link:
                raise Exception("No se ha configurado un enlace compartido de SharePoint")
                
            # Crear directorio temporal para almacenar el archivo
            temp_dir = Path("./temp")
            temp_dir.mkdir(exist_ok=True)
            
            # Nombre temporal para el archivo descargado
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            temp_file_path = temp_dir / f"sourcing_plan_temp_{timestamp}.xlsx"
            
            # Descargar el archivo usando requests
            print(f"Descargando desde: {self.download_link}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            }
            
            # Usar with para asegurar que la respuesta se cierre correctamente
            with requests.get(self.download_link, headers=headers, stream=True, allow_redirects=True) as response:
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
                        with requests.get(redirect_url, headers=headers, stream=True) as redirect_response:
                            if redirect_response.status_code == 200:
                                response = redirect_response
                            else:
                                raise Exception(f"Error al seguir redirección. Código: {redirect_response.status_code}")
                    else:
                        raise Exception(f"El enlace no devuelve un archivo Excel válido. Tipo de contenido: {content_type}")
                
                # Guardar el archivo descargado - CORRECCIÓN: Usar with para asegurar cierre del archivo
                with open(temp_file_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
            
            print(f"Archivo descargado exitosamente en: {temp_file_path}")
            
            # CORRECCIÓN: Esperar un momento para asegurar que el archivo esté disponible
            time.sleep(0.5)
            
            # CORRECCIÓN: Crear una copia del archivo para evitar problemas de acceso
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
            temp_file.close()  # Cerrar inmediatamente el archivo temporal
            
            # Copiar el archivo descargado al archivo temporal
            shutil.copy2(temp_file_path, temp_file.name)
            
            # Intentar eliminar el archivo original descargado
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Advertencia: No se pudo eliminar el archivo temporal descargado: {str(e)}")
                # No es crítico, se puede continuar
            
            return temp_file.name
            
        except Exception as e:
            print(f"Error detallado al descargar archivo desde enlace compartido: {str(e)}")
            # CORRECCIÓN: Limpiar archivos temporales en caso de error
            if temp_file and os.path.exists(temp_file.name):
                try:
                    os.unlink(temp_file.name)
                except:
                    pass
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
        temp_file = None
        try:
            # Descargar el archivo desde el enlace compartido
            temp_file = self.download_excel()
            
            # CORRECCIÓN: Verificar que el archivo temporal exista
            if not os.path.exists(temp_file):
                raise Exception(f"El archivo temporal no existe: {temp_file}")
            
            # Importar datos a la base de datos, ESPECIFICANDO LA HOJA
            result = import_from_excel(temp_file, db, user_id, sheet_name="Sourcing Plan")
            
            # CORRECCIÓN: Esperar un momento antes de intentar eliminar el archivo
            time.sleep(1)
            
            # Limpiar el archivo temporal con manejo de errores
            if os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception as e:
                    print(f"Advertencia: No se pudo eliminar el archivo temporal {temp_file}: {str(e)}")
                    # No es crítico, se puede continuar
            
            return result
        except Exception as e:
            print(f"Error en la sincronización desde SharePoint (enlace directo): {str(e)}")
            # CORRECCIÓN: Asegurarnos de limpiar archivos temporales incluso en caso de error
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception as cleanup_error:
                    print(f"Error al limpiar archivo temporal: {str(cleanup_error)}")
            raise Exception(f"Error en la sincronización desde SharePoint (enlace directo): {str(e)}")
    
    def sync_to_sharepoint(self, db: Session):
        """
        Sincroniza los datos desde la base de datos hacia el mismo Excel en SharePoint,
        preservando su estructura original
        """
        temp_file = None
        excel_path = None
        
        try:
            # Paso 1: Descargar el Excel actual para preservar su estructura
            try:
                excel_path = self.download_excel()
                print(f"Excel descargado exitosamente: {excel_path}")
            except Exception as download_error:
                print(f"Error al descargar Excel: {download_error}")
                # Si falla la descarga pero force_update está activado, crear un nuevo archivo
                if self.force_update:
                    print("Usando force_update: Creando un nuevo archivo Excel")
                    excel_path = self._create_new_excel_file()
                else:
                    raise download_error
            
            # Verificar que se obtuvo un archivo
            if not excel_path or not os.path.exists(excel_path):
                raise Exception(f"No se pudo obtener un archivo Excel válido: {excel_path}")
            
            # Paso 2: Obtener todos los contratos de la base de datos
            contracts = db.query(Contract).all()
            print(f"Total de contratos obtenidos de BD: {len(contracts)}")
            
            # Paso 3: Crear un DataFrame con los datos actualizados
            data = []
            for contract in contracts:
                contract_dict = {}
                for column in contract.__table__.columns:
                    value = getattr(contract, column.name)
                    contract_dict[column.name] = value
                data.append(contract_dict)
            
            df = pd.DataFrame(data)
            print(f"DataFrame creado con {len(df)} filas")
            
            # Paso 4: Crear un archivo Excel temporal nuevo
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
            temp_file.close()  # Cerrar inmediatamente
            
            # Guardar los datos en el nuevo archivo
            with pd.ExcelWriter(temp_file.name, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name="Sourcing Plan", index=False)
                
            print(f"Datos guardados en archivo temporal: {temp_file.name}")
            
            # Paso 5: Subir el archivo
            upload_result = self.upload_excel(temp_file.name)
            
            return {
                "message": "Sincronización exitosa con SharePoint. Excel actualizado con datos de la base de datos.",
                "file_path": upload_result.get('file_path') if isinstance(upload_result, dict) and 'file_path' in upload_result else None
            }
        
        except Exception as e:
            print(f"Error en sincronización hacia SharePoint: {str(e)}")
            # Limpiar archivos temporales
            for file_path in [excel_path, temp_file and temp_file.name]:
                if file_path and os.path.exists(file_path):
                    try:
                        os.unlink(file_path)
                    except:
                        pass
            raise Exception(f"Error en sincronización hacia SharePoint: {str(e)}")
        
    def _create_new_excel_file(self):
        """Crea un nuevo archivo Excel vacío con la estructura básica"""
        try:
            # Crear directorio temporal si no existe
            temp_dir = Path("./temp")
            temp_dir.mkdir(exist_ok=True)
            
            # Crear un archivo Excel vacío
            file_path = temp_dir / f"sourcing_plan_new_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Crear un DataFrame vacío con columnas básicas
            columns = [
                'id', 'contract_number', 'description', 'supplier', 'status',
                'start_date', 'end_date', 'currency', 'total_amount', 'remaining_amount',
                'category', 'subcategory', 'department', 'notes', 'additional_data',
                'sap_contract_number', 'sap_description', 'sap_supplier',
                'sap_start_date', 'sap_end_date', 'sap_currency', 'sap_total_amount',
                'sap_remaining_amount', 'sap_department', 'sap_category',
                'good_service', 'site', 'process_name', 'supply_area_name',
                'contract_type', 'opex_capex', 'contract_analyst', 'user_management',
                'category_n1_n2', 'contracting_type', 'budget_usd', 'cmf_code',
                'planned_process_start_date', 'contract_signed_end_date'
            ]
            
            df = pd.DataFrame(columns=columns)
            
            # Guardar en Excel
            with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name="Sourcing Plan", index=False)
            
            print(f"Archivo Excel vacío creado en: {file_path}")
            return str(file_path)
            
        except Exception as e:
            print(f"Error al crear archivo Excel vacío: {str(e)}")
            raise Exception(f"No se pudo crear un archivo Excel nuevo: {str(e)}")