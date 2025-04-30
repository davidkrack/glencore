import pandas as pd
import tempfile
import json
import os
import uuid
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from app.models.contract import Contract
from pathlib import Path
from sqlalchemy.exc import IntegrityError

def json_serial(obj):
    """Función de serialización JSON para objetos que no son serializables por defecto."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, time):
        return obj.isoformat()
    return str(obj) 

def safe_convert_to_date(value):
    """Convierte un valor a fecha, devolviendo None si no es una fecha válida"""
    if isinstance(value, pd.Timestamp):
        return value.date()
    elif isinstance(value, datetime):
        return value.date()
    elif isinstance(value, str):
        try:
            return pd.to_datetime(value).date()
        except:
            return None
    return None

def is_valid_date_value(value):
    """Verifica si un valor numérico está dentro del rango válido para fechas en Excel"""
    # Excel tiene un límite máximo para fechas (aproximadamente 31/12/9999)
    return isinstance(value, (int, float)) and value > 0 and value < 2958465

def calculate_renewal_alert(row):
    """
    Calcula automáticamente la alerta de renovación del contrato basado en:
    - Fecha de fin del contrato
    - Tipo de contrato (Recurrente/Spot)
    """
    try:
        if not pd.notna(row.get('end_date')) or not pd.notna(row.get('contract_type')):
            return ""
            
        end_date = pd.to_datetime(row['end_date']).date()
        today = datetime.now().date()
        days_remaining = (end_date - today).days
        
        # Solo generar alertas para contratos Recurrentes
        if row['contract_type'] == 'Recurrente':
            if days_remaining <= 90:
                return "Crítico"
            elif days_remaining <= 180:
                return "Alerta"
        
        return ""
    except:
        return ""

def calculate_process_start_alert(row):
    """
    Calcula automáticamente la alerta de inicio de proceso basado en:
    - Fecha planificada de inicio de proceso
    - Fecha actual
    """
    try:
        if not pd.notna(row.get('planned_process_start_date')):
            return ""
            
        planned_date = pd.to_datetime(row['planned_process_start_date']).date()
        today = datetime.now().date()
        days_remaining = (planned_date - today).days
        
        if days_remaining <= 0:
            return "Atrasado"
        elif days_remaining <= 15:
            return "Próximo"
        
        return ""
    except:
        return ""

def calculate_progress_percentage(row):
    """
    Calcula el porcentaje de avance del contrato basado en los hitos completados
    """
    try:
        # Definir los hitos clave y sus pesos
        milestones = [
            'solped_budget_approved_date',
            'strategy_committee_date',
            'market_release_date',
            'offers_reception_date',
            'technical_evaluation_date',
            'economic_evaluation_date',
            'negotiation_date',
            'contract_signed_date'
        ]
        
        # Contar cuántos hitos se han completado
        completed_milestones = sum(1 for milestone in milestones if pd.notna(row.get(milestone)))
        
        # Calcular el porcentaje de avance
        if len(milestones) > 0:
            return round((completed_milestones / len(milestones)) * 100, 2)
        return 0
    except:
        return 0

def import_from_excel(file_path: str, db: Session, user_id: int, sheet_name=None):
    """
    Versión mejorada de importación de Excel a la base de datos que maneja contratos repetidos
    """
    try:
        # Primero, listar todas las hojas disponibles para diagnóstico
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names
        print(f"Hojas disponibles en el archivo: {sheet_names}")
        
        # Intentar leer el archivo con diferentes opciones de sheet_name
        try:
            if sheet_name and sheet_name in sheet_names:
                # Usar la hoja especificada si se proporciona y existe
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                print(f"Usando hoja especificada: '{sheet_name}'")
            elif "Sourcing Plan" in sheet_names:
                # Intentar con "Sourcing Plan" si existe
                df = pd.read_excel(file_path, sheet_name="Sourcing Plan")
                print("Usando hoja 'Sourcing Plan'")
            else:
                # Si no funciona, usar la primera hoja
                df = pd.read_excel(file_path, sheet_name=sheet_names[0])
                print(f"Usando primera hoja: {sheet_names[0]}")
        except Exception as sheet_error:
            print(f"Error al intentar leer hojas específicas: {sheet_error}")
            # Último recurso - intentar leer con índice 0
            try:
                df = pd.read_excel(file_path, sheet_name=0)
                print(f"Usando hoja por índice 0")
            except Exception as e:
                print(f"Error crítico al leer Excel: {e}")
                raise Exception(f"No se pudo leer ninguna hoja del archivo Excel: {e}")
        
        # Convertir nombres de columnas a strings
        df.columns = [str(col) for col in df.columns]
        
        # Imprimir para diagnóstico
        print(f"Columnas encontradas: {df.columns.tolist()}")
        print(f"Total de filas: {len(df)}")
        if len(df) > 0:
            print(f"Ejemplo de las primeras filas:")
            for i, row in df.head(min(3, len(df))).iterrows():
                sample_values = [row.get(col) for col in df.columns[:5]] if len(df.columns) > 0 else []
                print(f"Fila {i}: {sample_values}...")
        
        # Tracking de números de contrato procesados para manejar duplicados
        processed_contracts = {}
        
        # Procesar cada fila
        contracts_imported = 0
        contracts_updated = 0
        
        for idx, row in df.iterrows():
            # Crear un contrato básico con los campos mínimos necesarios
            contract_data = {
                "contract_number": f"AUTO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{idx}",  # Default único
                "description": "Contrato importado",
                "supplier": "Proveedor importado",
                "created_by": user_id,
                "updated_by": user_id
            }
            
            # Intentar extraer los datos básicos de las columnas conocidas
            known_columns = {
                "contract_number": ["Contrato SAP Vigente (Antiguo)", "Contrato SAP", "Número de Contrato", 
                                   "Contrato SAP Vigente (Antiguo) o \"N/A\"", "Número"],
                "supplier": ["PROVEEDOR ACTUAL o PRINCIPAL", "Proveedor", "Proveedor SAP"],
                "description": ["Nombre Proceso", "Bien / Servicio", "Descripción", "Descripción SAP"],
                "status": ["Estado", "Estatus Actual", "current_status"],
                "site": ["Sitio"],
                "currency": ["Moneda"],
                "sap_contract_number": ["Contrato SAP Vigente (Antiguo)", "Número de Contrato SAP"],
                "sap_supplier": ["PROVEEDOR ACTUAL o PRINCIPAL", "Proveedor SAP"],
                "good_service": ["Bien / Servicio"],
                "process_name": ["Nombre Proceso"]
            }
            
            # Intentar extraer valores de columnas conocidas
            for field, possible_columns in known_columns.items():
                for col in possible_columns:
                    if col in df.columns and pd.notna(row[col]):
                        if isinstance(row[col], (int, float)):
                            contract_data[field] = str(row[col])
                        else:
                            contract_data[field] = row[col]
                        break
            
            # Guardar todos los datos adicionales de la fila
            additional_data = {}
            for col_name, value in row.items():
                if pd.notna(value):
                    # Ignorar valores nulos
                    col_str = str(col_name).strip()
                    
                    # Convertir fechas y otros tipos especiales para JSON
                    if isinstance(value, (datetime, date)):
                        additional_data[col_str] = value.isoformat()
                    elif isinstance(value, (int, float, bool)):
                        additional_data[col_str] = value
                    else:
                        additional_data[col_str] = str(value)
            
            if additional_data:
                contract_data["additional_data"] = json.dumps(additional_data, default=json_serial)
            
            # Asegurarse de que los campos obligatorios tengan valores
            if not contract_data.get("contract_number") or contract_data["contract_number"] == "nan":
                contract_data["contract_number"] = f"AUTO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{idx}"
            
            if not contract_data.get("description") or contract_data["description"] == "nan":
                contract_data["description"] = f"Contrato importado #{idx}"
            
            if not contract_data.get("supplier") or contract_data["supplier"] == "nan":
                contract_data["supplier"] = "Proveedor no especificado"
            
            # Manejar contratos duplicados - añadir sufijo único si es necesario
            original_contract_number = contract_data["contract_number"]
            contract_identifier = original_contract_number
            
            # Si este número de contrato ya existe, añadir identificadores adicionales
            if contract_identifier in processed_contracts:
                # Buscar otros campos que puedan ayudar a diferenciar (como bien/servicio o descripción)
                differentiators = []
                if "good_service" in contract_data and contract_data["good_service"]:
                    differentiators.append(str(contract_data["good_service"]))
                if "description" in contract_data and contract_data["description"]:
                    differentiators.append(str(contract_data["description"]))
                if "site" in contract_data and contract_data["site"]:
                    differentiators.append(str(contract_data["site"]))
                
                # Si encontramos diferenciadores, úsalos para crear un identificador más específico
                if differentiators:
                    # Usar un hash para no exceder la longitud del campo
                    import hashlib
                    diff_hash = hashlib.md5("-".join(differentiators).encode()).hexdigest()[:8]
                    contract_identifier = f"{original_contract_number}-{diff_hash}"
                else:
                    # Si no hay diferenciadores específicos, usar contador simple
                    suffix_count = processed_contracts[original_contract_number] + 1
                    processed_contracts[original_contract_number] = suffix_count
                    contract_identifier = f"{original_contract_number}-{suffix_count}"
                
                # Actualizar el número de contrato para esta fila
                contract_data["contract_number"] = contract_identifier
                print(f"Contrato duplicado encontrado. Original: {original_contract_number}, Nuevo: {contract_identifier}")
            else:
                # Registrar este contrato como procesado (inicializar contador)
                processed_contracts[original_contract_number] = 1
            
            try:
                # Crear nuevo contrato (siempre insertamos como nuevo, ya que hemos generado números únicos)
                new_contract = Contract(**contract_data)
                db.add(new_contract)
                contracts_imported += 1
                
                # Commit periódico para evitar transacciones demasiado grandes
                if contracts_imported % 100 == 0:
                    db.commit()
                    print(f"Procesados: {contracts_imported} contratos")
            
            except IntegrityError as integrity_error:
                # Si aún hay un error de integridad, hacer rollback y continuar con un valor totalmente único
                db.rollback()
                print(f"Error de integridad: {integrity_error}")
                
                # Generar un número totalmente único y reintentar
                unique_contract_number = f"UNIQUE-{str(uuid.uuid4())[:8]}-{idx}"
                contract_data["contract_number"] = unique_contract_number
                
                try:
                    new_contract = Contract(**contract_data)
                    db.add(new_contract)
                    contracts_imported += 1
                    db.commit()
                    print(f"Reintento exitoso con número único: {unique_contract_number}")
                except Exception as retry_error:
                    db.rollback()
                    print(f"Error crítico en reintento: {retry_error}")
                    # Continuar con el siguiente contrato
                    continue
                
            except Exception as contract_error:
                db.rollback()
                print(f"Error al procesar contrato: {contract_error}")
                print(f"Datos del contrato: {contract_data}")
                # Continuar con el siguiente contrato
                continue
        
        # Commit final
        try:
            db.commit()
        except Exception as final_commit_error:
            db.rollback()
            print(f"Error en commit final: {final_commit_error}")
            
        print(f"Total: {contracts_imported} contratos procesados")
        
        return {
            "contracts_imported": contracts_imported
        }
    
    except Exception as e:
        try:
            db.rollback()
        except:
            pass
        print(f"Error general en importación: {e}")
        raise e
    
def export_to_excel(db: Session):
    """
    Exporta datos de la base de datos a un archivo Excel de manera simple y directa
    """
    try:
        # Obtener todos los contratos
        contracts = db.query(Contract).all()
        
        # Convertir contratos a diccionarios simples
        data = []
        for contract in contracts:
            contract_dict = {}
            for column in contract.__table__.columns:
                # Incluir todos los campos excepto algunos específicos internos
                if column.name not in ['id', 'created_at', 'updated_at']:
                    value = getattr(contract, column.name)
                    # Convertir fechas a formato string para evitar problemas
                    if isinstance(value, (datetime, date)):
                        value = value.isoformat() if value else None
                    contract_dict[column.name] = value
            
            # Agregar datos adicionales si existen
            if contract.additional_data:
                try:
                    add_data = json.loads(contract.additional_data)
                    if isinstance(add_data, dict):
                        for key, value in add_data.items():
                            contract_dict[f"add_{key}"] = value
                except:
                    pass
                    
            data.append(contract_dict)
        
        # Crear DataFrame simple
        df = pd.DataFrame(data)
        
        # Guardar en archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        with pd.ExcelWriter(temp_file.name, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name="Sourcing Plan", index=False)
        
        return temp_file.name
    
    except Exception as e:
        print(f"Error al exportar: {e}")
        raise e