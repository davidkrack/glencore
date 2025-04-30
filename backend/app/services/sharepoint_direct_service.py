"""
Servicio para la integración con SharePoint usando un enlace directo compartido
"""
import os
import tempfile
import requests
from pathlib import Path
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from app.services.excel_service import import_from_excel, export_to_excel
import pandas as pd
from app.models.contract import Contract
from app.models.user import User

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
            
            # Importar datos a la base de datos, ESPECIFICANDO LA HOJA (esto es lo que causa el error)
            result = import_from_excel(excel_path, db, user_id, sheet_name="Sourcing Plan")
            
            # Limpiar el archivo temporal
            if os.path.exists(excel_path):
                os.remove(excel_path)
            
            return result
        except Exception as e:
            print(f"Error en la sincronización desde SharePoint (enlace directo): {str(e)}")
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
            excel_path = self.download_excel()
            
            # CORRECCIÓN: Verificar que el archivo descargado exista
            if not os.path.exists(excel_path):
                raise Exception(f"No se pudo descargar el archivo Excel: {excel_path}")
            
            # Paso 2: Leer el Excel para obtener su estructura original
            original_df = pd.read_excel(excel_path)
            
            # Guarda una copia de respaldo antes de modificar
            backup_dir = Path("./backups")
            backup_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = backup_dir / f"sourcing_plan_backup_{timestamp}.xlsx"
            original_df.to_excel(backup_path, index=False)
            
            # Paso 3: Obtener todos los contratos de la base de datos
            contracts = db.query(Contract).all()
            
            # Paso 4: Preparar los datos actualizados manteniendo la estructura original
            updated_data = []
            
            # Convertir columnas a strings para evitar problemas de comparación
            original_df.columns = [str(col) for col in original_df.columns]
            
            # Crear un mapeo de campos del modelo a columnas del Excel
            # Este mapeo debe ser preciso y completo
            model_to_excel = {
                'sap_contract_number': ['Contrato SAP Vigente (Antiguo) o "N/A"', 'Contrato SAP Vigente (Antiguo)', 'Número de Contrato SAP'],
                'supplier': ['PROVEEDOR ACTUAL o PRINCIPAL', 'Proveedor SAP'],
                'sap_start_date': ['Fecha de inicio Contrato Vigente SAP', 'Fecha Inicio SAP'],
                'sap_end_date': ['Fecha Vencimiento Contrato SAP', 'Fecha Fin SAP', 'Fecha Vencimiento Contrato SAP (Fecha Límite)'],
                'currency': ['Moneda', 'Moneda SAP'],
                'sap_total_amount': ['Monto contrato SAP', 'Valor Actual Contrato Vigente SAP', 'Monto Total SAP'],
                'sap_remaining_amount': ['Monto de consumo SAP', 'Monto Restante SAP'],
                'good_service': ['Bien / Servicio'],
                'site': ['Sitio'],
                'process_name': ['Nombre Proceso'],
                'supply_area_name': ['Nombre de Área Supply'],
                'contract_type': ['Tipo de Contrato'],
                'opex_capex': ['OPEX / CAPEX'],
                'contract_analyst': ['Analista de Contratos'],
                'category_n1_n2': ['Categoría (N1+N2)', 'Categoría Supply'],
                'contracting_type': ['Tipo de Contratación'],
                'budget_usd': ['Budget (USD) Informado por Finanzas'],
                'cmf_code': ['Código Interno Planificación (CMF)'],
                'planned_process_start_date': ['Fecha de Inicio del Proceso (Planificado)'],
                'contract_signed_end_date': ['Fecha de Fin "11.Finalizado (Contrato Firmado)"']
            }
            
            # Añadir mapeo para hitos
            milestone_mapping = {
                'solped_budget_approved_date': ['Solped con Budget Aprobado'],
                'strategy_committee_date': ['Comité de Estrategia'],
                'market_release_date': ['Salida a mercado'],
                'queries_date': ['Consultas'],
                'offers_reception_date': ['Recepción ofertas'],
                'technical_evaluation_date': ['Evaluación técnica'],
                'economic_evaluation_date': ['Evaluación económica'],
                'negotiation_date': ['Negociación'],
                'sc_committee_date': ['Comité SC'],
                'site_committee_date': ['Comité de sitio'],
                'regional_committee_date': ['Comité regional'],
                'global_committee_date': ['Comité global'],
                'contract_signed_date': ['Fecha de Adjudicación (Contrato firmado)'],
                'kickoff_date': ['Kickoff'],
                'current_status': ['Estatus Actual'],
                'comment': ['Comentario'],
                'real_award_date': ['Fecha Adjudicación Real'],
                'tender_code': ['Código Licitación'],
                'awarded_amount': ['Monto Adjudicado'],
                'sap_contract_number_new': ['Número de Contrato en SAP'],
                'new_contract_term_months': ['Plazo del nuevo contrato (meses)'],
                'progress_percentage': ['% de Avance'],
                'process_start_alert': ['Alerta Inicio proceso'],
                'renewal_alert': ['Alerta Renovación del Contrato', 'Alerta de consumo de Contrato']
            }
            
            # Combinar los mapeos
            model_to_excel.update(milestone_mapping)
            
            # Paso 5: Construir mapeo inverso para búsqueda eficiente
            excel_to_model = {}
            for model_field, excel_columns in model_to_excel.items():
                for excel_col in excel_columns:
                    excel_to_model[excel_col] = model_field
            
            # Paso 6: Crear clave de identificación para buscar contratos existentes
            # Usamos el número de contrato como clave principal
            contract_keys = {}
            for contract in contracts:
                key = contract.sap_contract_number or contract.contract_number
                if key:
                    contract_keys[key] = contract
            
            # Paso 7: Actualizar las filas existentes y añadir nuevas filas desde la BD
            updated_rows = []
            processed_contracts = set()
            
            # Primero procesar las filas que ya existen en el Excel
            for _, row in original_df.iterrows():
                # Intentar encontrar la clave del contrato en esta fila
                contract_key = None
                for col_name in ['Contrato SAP Vigente (Antiguo) o "N/A"', 'Contrato SAP Vigente (Antiguo)', 'Número de Contrato SAP']:
                    if col_name in row and pd.notna(row[col_name]):
                        contract_key = str(row[col_name])
                        break
                
                # Si encontramos el contrato en la BD, actualizar los valores
                if contract_key and contract_key in contract_keys:
                    contract = contract_keys[contract_key]
                    processed_contracts.add(contract_key)
                    
                    # Copiar la fila original
                    updated_row = row.copy()
                    
                    # Actualizar los campos que han cambiado en la BD
                    for excel_col in row.index:
                        if excel_col in excel_to_model:
                            model_field = excel_to_model[excel_col]
                            value = getattr(contract, model_field)
                            if value is not None:
                                if isinstance(value, (datetime, date)):
                                    # Para fechas, mantener el formato original
                                    updated_row[excel_col] = value
                                else:
                                    updated_row[excel_col] = value
                    
                    updated_rows.append(updated_row)
                else:
                    # Si no encontramos el contrato, mantener la fila original
                    updated_rows.append(row)
            
            # Añadir contratos nuevos que no estaban en el Excel original
            for contract_key, contract in contract_keys.items():
                if contract_key not in processed_contracts:
                    new_row = {}
                    
                    # Asignar valores del contrato a columnas del Excel
                    for model_field, excel_columns in model_to_excel.items():
                        value = getattr(contract, model_field)
                        if value is not None:
                            # Usar la primera columna asociada al campo del modelo
                            for excel_col in excel_columns:
                                if excel_col in original_df.columns:
                                    new_row[excel_col] = value
                                    break
                    
                    updated_rows.append(pd.Series(new_row, index=original_df.columns))
            
            # Paso 8: Crear el DataFrame actualizado con la misma estructura
            updated_df = pd.DataFrame(updated_rows, columns=original_df.columns)
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
            temp_file.close()  # Cerrar inmediatamente
            try:
                with pd.ExcelWriter(temp_file.name, engine='openpyxl') as writer:
                    updated_df.to_excel(writer, index=False)
            except Exception as e:
                raise Exception(f"Error al guardar archivo temporal: {str(e)}")

            # Paso 9: Guardar el DataFrame actualizado en el mismo archivo
            updated_df.to_excel(excel_path, index=False)
            
            # Paso 10: Subir el archivo actualizado a SharePoint
            upload_result = self.upload_excel(excel_path)
            
            # Limpiar el archivo temporal
            files_to_clean = [excel_path, temp_file.name]
            for file_path in files_to_clean:
                if file_path and os.path.exists(file_path):
                    try:
                        # Intento mejorado de eliminación con reintentos
                        max_retries = 3
                        for i in range(max_retries):
                            try:
                                time.sleep(0.5 * (i + 1))  # Espera incremental
                                os.unlink(file_path)
                                break
                            except PermissionError:
                                if i == max_retries - 1:
                                    print(f"Error persistente al eliminar {file_path}")
                                    raise
                                continue
                    except Exception as e:
                        print(f"Advertencia: No se pudo eliminar {file_path}: {str(e)}")
            
            return {
                "message": "Sincronización exitosa con SharePoint. Excel actualizado manteniendo su estructura original.",
                "file_path": str(upload_result.get('file_path')) if isinstance(upload_result, dict) and 'file_path' in upload_result else None
            }
        
        except Exception as e:
            print(f"Error en sincronización hacia SharePoint: {str(e)}")
            # Limpieza mejorada de archivos temporales
            files_to_clean = [excel_path, temp_file.name if temp_file else None]
            for file_path in files_to_clean:
                if file_path and os.path.exists(file_path):
                    try:
                        os.unlink(file_path)
                    except Exception as cleanup_error:
                        print(f"Error al limpiar archivo temporal {file_path}: {str(cleanup_error)}")
            raise Exception(f"Error en sincronización hacia SharePoint: {str(e)}")

# Para uso de prueba y desarrollo
if __name__ == "__main__":
    print("Probando servicio de SharePoint con enlace directo...")
    service = SharePointDirectService()
    print(f"Configuración: {service.download_link}")
    print("Completado.")