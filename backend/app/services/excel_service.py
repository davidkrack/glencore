import pandas as pd
import tempfile
import json
import os
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from app.models.contract import Contract
from pathlib import Path

def json_serial(obj):
    """Función de serialización JSON para objetos datetime/date/time."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, time):
        return obj.isoformat()
    raise TypeError(f"Tipo {type(obj)} no serializable")

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

def import_from_excel(file_path: str, db: Session, user_id: int, sheet_name="Sourcing Plan"):
    """
    Importa datos de un archivo Excel a la base de datos siguiendo la estructura del Sourcing Plan
    """
    try:
        # Leer el archivo Excel, especificando la hoja "Sourcing Plan"
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        # Imprimir información para diagnóstico
        print(f"Leyendo datos de la hoja: {sheet_name}")
        print(f"Columnas encontradas: {df.columns.tolist()}")
        print(f"Total de filas: {len(df)}")
        
        # Convertir todos los nombres de columnas a strings para evitar problemas
        df.columns = [str(col) for col in df.columns]
        
        # Imprimir nombres de columnas para diagnóstico
        print("Columnas en el Excel:", df.columns.tolist())
        
        # Contador de contratos importados
        contracts_imported = 0
        
        # Mapeo más flexible para columnas obligatorias - incluye posibles variaciones en los nombres
        flexible_mapping = {
            # Para contract_number - columna A
            'contract_number': [
                'Contrato SAP Vigente (Antiguo)', 'Contrato SAP', 'Número de Contrato',
                'Contrato SAP Vigente (Antiguo) o "N/A"', '0', 0, 'A'
            ],
            # Para supplier - columna B
            'supplier': [
                'PROVEEDOR ACTUAL o PRINCIPAL', 'Proveedor', 'Proveedor SAP', '1', 1, 'B'
            ],
            # Para description - columna K o combinación de otras
            'description': [
                'Bien / Servicio', 'Descripción', 'Nombre Proceso', 
                'Descripción SAP', '10', 10, 'K'
            ]
        }
        
        # Mapeo de columnas del Excel a campos del modelo
        # Primera sección: Datos SAP (A-J)
        sap_mapping = {
            'Número de Contrato SAP': 'sap_contract_number',
            'Descripción SAP': 'sap_description',
            'Proveedor SAP': 'sap_supplier',
            'Fecha Inicio SAP': 'sap_start_date',
            'Fecha Fin SAP': 'sap_end_date',
            'Moneda SAP': 'sap_currency',
            'Monto Total SAP': 'sap_total_amount',
            'Monto Restante SAP': 'sap_remaining_amount',
            'Departamento SAP': 'sap_department',
            'Categoría SAP': 'sap_category',
            'Contrato SAP Vigente (Antiguo)': 'sap_contract_number',
            'Contrato SAP Vigente (Antiguo) o "N/A"': 'sap_contract_number',
            'PROVEEDOR ACTUAL o PRINCIPAL': 'sap_supplier',
            'Fecha de inicio Contrato Vigente SAP': 'sap_start_date',
            'Fecha Vencimiento Contrato SAP': 'sap_end_date',
            'Fecha Vencimiento Contrato SAP (Fecha Límite)': 'sap_end_date',
            'Moneda': 'sap_currency',
            'Monto contrato SAP': 'sap_total_amount',
            'Monto de consumo SAP': 'sap_remaining_amount',
            'Monto contrato SAP en USD': 'sap_total_amount_usd',
            'Monto de consumo SAP en USD': 'sap_remaining_amount_usd'
        }
        
        # Segunda sección: Datos analistas (K-S)
        analyst_mapping = {
            'Bien / Servicio': 'good_service',
            'Sitio': 'site',
            'Nombre Proceso': 'process_name',
            'Nombre de Área Supply': 'supply_area_name',
            'Tipo de Contrato': 'contract_type',
            'OPEX / CAPEX': 'opex_capex',
            'Analista de Contratos': 'contract_analyst',
            'Gerencia Usuaria': 'user_management',
            'Categoría (N1+N2)': 'category_n1_n2',
            'Alerta de consumo de Contrato': 'contract_alert'
        }
        
        # Campos adicionales y hitos del proceso
        additional_mapping = {
            'Tipo de Contratación': 'contracting_type',
            'Budget (USD) Informado por Finanzas': 'budget_usd',
            'Código Interno Planificación (CMF)': 'cmf_code',
            'Fecha de Inicio del Proceso (Planificado)': 'planned_process_start_date',
            'Fecha de Fin "11.Finalizado (Contrato Firmado)"': 'contract_signed_end_date',
            'Solped con Budget Aprobado': 'solped_budget_approved_date',
            'Comité de Estrategia': 'strategy_committee_date',
            'Salida a mercado': 'market_release_date',
            'Consultas': 'queries_date',
            'Recepción ofertas': 'offers_reception_date',
            'Evaluación técnica': 'technical_evaluation_date',
            'Evaluación económica': 'economic_evaluation_date',
            'Negociación': 'negotiation_date',
            'Comité SC': 'sc_committee_date',
            'Comité de sitio': 'site_committee_date',
            'Comité regional': 'regional_committee_date',
            'Comité global': 'global_committee_date',
            'Fecha de Adjudicación (Contrato firmado)': 'contract_signed_date',
            'Kickoff': 'kickoff_date',
            'Estatus Actual': 'current_status',
            'Comentario': 'comment',
            'Fecha Adjudicación Real': 'real_award_date',
            'Código Licitación': 'tender_code',
            'Monto Adjudicado': 'awarded_amount',
            'Número de Contrato en SAP': 'sap_contract_number_new',
            'Plazo del nuevo contrato (meses)': 'new_contract_term_months'
        }
        
        # Combinar todos los mapeos
        field_mapping = {
            **sap_mapping,
            **analyst_mapping,
            **additional_mapping,
            # Campos básicos también incluidos para compatibilidad
            'Número de Contrato': 'contract_number',
            'Descripción': 'description',
            'Proveedor': 'supplier',
            'Estado': 'status',
            'Fecha Inicio': 'start_date',
            'Fecha Fin': 'end_date',
            'Moneda': 'currency',
            'Monto Total': 'total_amount',
            'Monto Restante': 'remaining_amount'
        }
        
        # Identificar columnas adicionales que no están en el mapeo
        all_columns = df.columns.tolist()
        mapped_columns = list(field_mapping.keys())
        additional_columns = [col for col in all_columns if col not in mapped_columns]
        
        # Procesar cada fila del Excel
        for _, row in df.iterrows():
            # Preparar diccionario de contrato
            contract_data = {}
            
            # 1. Primero, asignar campos obligatorios usando el mapeo flexible
            for field, possible_cols in flexible_mapping.items():
                # Buscar en todas las posibles columnas
                for col in possible_cols:
                    # Verificar si es índice numérico o nombre de columna
                    value = None
                    if isinstance(col, int) and 0 <= col < len(row):
                        value = row.iloc[col]
                    elif isinstance(col, str):
                        if col.isdigit():  # Si es string numérico, usarlo como índice
                            col_idx = int(col)
                            if 0 <= col_idx < len(row):
                                value = row.iloc[col_idx]
                        elif col in row.index:
                            value = row[col]
                        
                    # Si encontramos un valor no nulo, usarlo
                    if value is not None and pd.notna(value):
                        contract_data[field] = value
                        break
                
                # Si no se encontró valor para el campo obligatorio, asignar uno predeterminado
                if field not in contract_data or pd.isna(contract_data[field]):
                    if field == 'contract_number':
                        contract_data[field] = f"AUTO-{datetime.now().strftime('%Y%m%d%H%M%S')}-{_}"
                    elif field == 'supplier':
                        contract_data[field] = "Proveedor no especificado"
                    elif field == 'description':
                        contract_data[field] = f"Contrato {_}"
            
            # 2. Ahora procesar el resto de campos usando el mapeo normal
            for excel_col, model_field in field_mapping.items():
                if excel_col in row.index and pd.notna(row[excel_col]):
                    value = row[excel_col]
                    
                    # Procesamiento especial para columnas monetarias problemáticas
                    if excel_col in ['Valor Actual Contrato Vigente SAP', 'Valor Estimado Nueva Licitación en Moneda Local', 
                                     'Monto contrato SAP', 'Monto de consumo SAP']:
                        try:
                            if isinstance(value, (int, float)):
                                contract_data[model_field] = float(value)
                            elif isinstance(value, str) and value.strip():
                                # Si es un string, intentar convertirlo a número eliminando formato
                                value = value.replace(',', '').replace('$', '').strip()
                                contract_data[model_field] = float(value)
                        except:
                            # Si no se puede convertir, omitir
                            continue
                        continue  # Saltamos el procesamiento normal para estas columnas
                    
                    # Manejar diferentes tipos de campos
                    if model_field.endswith('_date'):
                        # Es un campo de fecha
                        if isinstance(value, pd.Timestamp):
                            value = value.date()
                        elif isinstance(value, (int, float)) and not is_valid_date_value(value):
                            # Valores numéricos grandes que Excel interpreta incorrectamente como fechas
                            continue
                    elif any(keyword in model_field for keyword in ['amount', 'budget', 'value']):
                        # Es un campo monetario
                        try:
                            value = float(value)
                        except:
                            continue
                    
                    contract_data[model_field] = value
            
            # 3. Calcular campos automáticos - asegurar que existan en el modelo
            try:
                contract_data['renewal_alert'] = calculate_renewal_alert(contract_data)
                contract_data['process_start_alert'] = calculate_process_start_alert(contract_data)
                contract_data['progress_percentage'] = calculate_progress_percentage(contract_data)
            except Exception as e:
                print(f"Error al calcular campos automáticos: {e}")
                # Si hay error, guardar en additional_data
                if 'additional_data' not in contract_data:
                    contract_data['additional_data'] = "{}"
                
                # Asegurar que additional_data sea un JSON válido
                try:
                    additional_data = json.loads(contract_data['additional_data'])
                except:
                    additional_data = {}
                
                # Calcular y guardar valores
                try:
                    additional_data['renewal_alert'] = calculate_renewal_alert(contract_data)
                except:
                    pass
                
                try:
                    additional_data['process_start_alert'] = calculate_process_start_alert(contract_data)
                except:
                    pass
                
                try:
                    additional_data['progress_percentage'] = calculate_progress_percentage(contract_data)
                except:
                    pass
                
                # Convertir de nuevo a JSON
                contract_data['additional_data'] = json.dumps(additional_data, default=json_serial)
            
            # 4. Preparar datos adicionales
            additional_data = {}
            for col in additional_columns:
                if col in row.index and pd.notna(row[col]):
                    try:
                        # Asegurar que las claves sean strings
                        additional_data[str(col)] = row[col]
                    except Exception as e:
                        print(f"Error al procesar columna adicional {col}: {e}")
            
            if additional_data:
                # Si ya hay additional_data, combinarlo
                if 'additional_data' in contract_data:
                    try:
                        existing_data = json.loads(contract_data['additional_data'])
                        if isinstance(existing_data, dict):
                            existing_data.update(additional_data)
                            additional_data = existing_data
                    except:
                        pass
                
                contract_data['additional_data'] = json.dumps(additional_data, default=json_serial)
            
            # 5. Verificar si el contrato ya existe
            contract_number = contract_data.get('contract_number')
            existing_contract = None
            
            if contract_number:
                existing_contract = db.query(Contract).filter(Contract.contract_number == contract_number).first()
            
            # Si no se encuentra por número de contrato, buscar por número SAP
            sap_number = contract_data.get('sap_contract_number')
            if not existing_contract and sap_number:
                existing_contract = db.query(Contract).filter(Contract.sap_contract_number == sap_number).first()
            
            # 6. Verificar que tenga los campos obligatorios
            required_fields = ['contract_number', 'description', 'supplier']
            missing_fields = [field for field in required_fields if field not in contract_data or not contract_data[field]]
            
            if missing_fields:
                debug_info = {
                    'Número de Contrato SAP': row.get('Contrato SAP Vigente (Antiguo)', "No disponible"),
                    'PROVEEDOR ACTUAL o PRINCIPAL': row.get('PROVEEDOR ACTUAL o PRINCIPAL', "No disponible"),
                    'Bien / Servicio': row.get('Bien / Servicio', "No disponible")
                }
                print(f"Advertencia: Faltan campos requeridos: {missing_fields}, datos disponibles: {debug_info}, fila: {_}")
                continue
            
            # 7. Crear o actualizar contrato
            try:
                if existing_contract:
                    # Actualizar contrato existente
                    contract_data['updated_by'] = user_id
                    contract_data['updated_at'] = datetime.utcnow()
                    
                    for field, value in contract_data.items():
                        setattr(existing_contract, field, value)
                    
                    db.commit()
                else:
                    # Crear nuevo contrato
                    contract_data['created_by'] = user_id
                    contract_data['updated_by'] = user_id
                    
                    new_contract = Contract(**contract_data)
                    db.add(new_contract)
                    db.commit()
                
                contracts_imported += 1
            except Exception as e:
                print(f"Error al guardar contrato: {e}")
                db.rollback()
        
        return {
            "contracts_imported": contracts_imported
        }
    
    except Exception as e:
        db.rollback()
        raise e
    
def export_to_excel(db: Session, sheet_name="Sourcing Plan"):
    """
    Exporta datos de la base de datos a un archivo Excel en la hoja correcta
    """
    try:
        # Obtener todos los contratos
        contracts = db.query(Contract).all()
        
        # Crear un DataFrame
        data = []
        for contract in contracts:
            # Primero prepara los datos básicos del contrato
            contract_data = {
                # Información básica
                'Número de Contrato': contract.contract_number,
                'Descripción': contract.description,
                'Proveedor': contract.supplier,
                'Estado': contract.status,
                'Fecha Inicio': contract.start_date,
                'Fecha Fin': contract.end_date,
                'Moneda': contract.currency,
                'Monto Total': contract.total_amount,
                'Monto Restante': contract.remaining_amount,
                
                # Datos SAP (A-J)
                'Número de Contrato SAP': contract.sap_contract_number,
                'Descripción SAP': contract.sap_description,
                'Proveedor SAP': contract.sap_supplier,
                'Fecha Inicio SAP': contract.sap_start_date,
                'Fecha Fin SAP': contract.sap_end_date,
                'Moneda SAP': contract.sap_currency,
                'Monto Total SAP': contract.sap_total_amount,
                'Monto Restante SAP': contract.sap_remaining_amount,
                'Departamento SAP': contract.sap_department,
                'Categoría SAP': contract.sap_category,
                
                # Datos llenados por analistas (K-S)
                'Bien / Servicio': contract.good_service,
                'Sitio': contract.site,
                'Nombre Proceso': contract.process_name,
                'Nombre de Área Supply': contract.supply_area_name,
                'Tipo de Contrato': contract.contract_type,
                'OPEX / CAPEX': contract.opex_capex,
                'Analista de Contratos': contract.contract_analyst,
                'Gerencia Usuaria': contract.user_management,
                'Categoría (N1+N2)': contract.category_n1_n2,
                
                # Columna T - Calculada (Alerta Renovación)
                'Alerta Renovación del Contrato': getattr(contract, 'renewal_alert', ''),
                
                # Campos U-Y
                'Tipo de Contratación': contract.contracting_type,
                'Budget (USD) Informado por Finanzas': contract.budget_usd,
                'Código Interno Planificación (CMF)': contract.cmf_code,
                'Fecha de Inicio del Proceso (Planificado)': contract.planned_process_start_date,
                'Fecha de Fin "11.Finalizado (Contrato Firmado)"': contract.contract_signed_end_date,
                
                # Columna Z - Calculada (Alerta Inicio Proceso)
                'Alerta Inicio Proceso': getattr(contract, 'process_start_alert', ''),
                
                # Campos AA-AU - Fechas de hitos internos
                'Solped con Budget Aprobado': contract.solped_budget_approved_date,
                'Comité de Estrategia': contract.strategy_committee_date,
                'Salida a mercado': contract.market_release_date,
                'Consultas': contract.queries_date,
                'Recepción ofertas': contract.offers_reception_date,
                'Evaluación técnica': contract.technical_evaluation_date,
                'Evaluación económica': contract.economic_evaluation_date,
                'Negociación': contract.negotiation_date,
                'Comité SC': contract.sc_committee_date,
                'Comité de sitio': contract.site_committee_date,
                'Comité regional': contract.regional_committee_date,
                'Comité global': contract.global_committee_date,
                'Fecha de Adjudicación (Contrato firmado)': contract.contract_signed_date,
                'Kickoff': contract.kickoff_date,
                'Estatus Actual': contract.current_status,
                'Comentario': contract.comment,
                'Fecha Adjudicación Real': contract.real_award_date,
                'Código Licitación': contract.tender_code,
                'Monto Adjudicado': contract.awarded_amount,
                'Número de Contrato en SAP': contract.sap_contract_number_new,
                'Plazo del nuevo contrato (meses)': contract.new_contract_term_months,
                
                # Campos calculados automáticos (AV-AZ)
                '% de Avance': getattr(contract, 'progress_percentage', 0),
                'Duración SLA': getattr(contract, 'sla_duration', 0),
                'Completitud general': getattr(contract, 'general_completeness', 0)
            }
            
            # Agregar datos adicionales si existen
            if contract.additional_data:
                try:
                    additional_data = json.loads(contract.additional_data)
                    for key, value in additional_data.items():
                        if key not in contract_data:
                            contract_data[key] = value
                except:
                    pass
            
            data.append(contract_data)
        
        # Crear DataFrame y exportar a Excel
        df = pd.DataFrame(data)
        
        # Crear una copia backup en la carpeta backup
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        with pd.ExcelWriter(temp_file.name, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
        # Backup
        backup_dir = Path("./backups")
        backup_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = backup_dir / f"sourcing_plan_backup_{timestamp}.xlsx"
        
        with pd.ExcelWriter(str(backup_path), engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
        return temp_file.name

    
    except Exception as e:
        raise e