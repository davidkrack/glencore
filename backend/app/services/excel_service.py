import pandas as pd
import tempfile
import json
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.contract import Contract
from pathlib import Path

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

def import_from_excel(file_path: str, db: Session, user_id: int):
    """
    Importa datos de un archivo Excel a la base de datos siguiendo la estructura del Sourcing Plan
    """
    try:
        # Leer el archivo Excel
        df = pd.read_excel(file_path)
        
        # Contador de contratos importados
        contracts_imported = 0
        
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
            'Categoría SAP': 'sap_category'
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
            'Categoría (N1+N2)': 'category_n1_n2'
        }
        
        # Tercera sección: Columna T (calculada)
        # Se calcula automáticamente, no se importa
        
        # Cuarta sección: Campos U-Y
        additional_mapping = {
            'Tipo de Contratación': 'contracting_type',
            'Budget (USD) Informado por Finanzas': 'budget_usd',
            'Código Interno Planificación (CMF)': 'cmf_code',
            'Fecha de Inicio del Proceso (Planificado)': 'planned_process_start_date',
            'Fecha de Fin "11.Finalizado (Contrato Firmado)"': 'contract_signed_end_date'
        }
        
        # Quinta sección: Columna Z (calculada)
        # Se calcula automáticamente, no se importa
        
        # Sexta sección: Hitos internos (AA-AU)
        milestones_mapping = {
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
            **milestones_mapping,
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
            # Verificar si el contrato ya existe buscando por número de contrato
            contract_number = row.get('Número de Contrato')
            existing_contract = None
            
            if pd.notna(contract_number):
                existing_contract = db.query(Contract).filter(Contract.contract_number == contract_number).first()
            
            # Si no se encuentra por número de contrato, buscar por número SAP
            sap_number = row.get('Número de Contrato SAP')
            if not existing_contract and pd.notna(sap_number):
                existing_contract = db.query(Contract).filter(Contract.sap_contract_number == sap_number).first()
            
            # Preparar datos básicos
            contract_data = {}
            for excel_col, model_field in field_mapping.items():
                if excel_col in row and pd.notna(row[excel_col]):
                    value = row[excel_col]
                    # Convertir fechas a formato adecuado
                    if isinstance(value, pd.Timestamp):
                        value = value.date()
                    contract_data[model_field] = value
            
            # Calcular campos automáticos
            contract_data['renewal_alert'] = calculate_renewal_alert(contract_data)
            contract_data['process_start_alert'] = calculate_process_start_alert(contract_data)
            contract_data['progress_percentage'] = calculate_progress_percentage(contract_data)
            
            # Preparar datos adicionales
            additional_data = {}
            for col in additional_columns:
                if pd.notna(row[col]):
                    additional_data[col] = row[col]
            
            if additional_data:
                contract_data['additional_data'] = json.dumps(additional_data)
            
            # Crear o actualizar contrato
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
        
        return {
            "contracts_imported": contracts_imported
        }
    
    except Exception as e:
        db.rollback()
        raise e

def export_to_excel(db: Session):
    """
    Exporta datos de la base de datos a un archivo Excel siguiendo la estructura del Sourcing Plan
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
                'Alerta Renovación del Contrato': contract.renewal_alert,
                
                # Campos U-Y
                'Tipo de Contratación': contract.contracting_type,
                'Budget (USD) Informado por Finanzas': contract.budget_usd,
                'Código Interno Planificación (CMF)': contract.cmf_code,
                'Fecha de Inicio del Proceso (Planificado)': contract.planned_process_start_date,
                'Fecha de Fin "11.Finalizado (Contrato Firmado)"': contract.contract_signed_end_date,
                
                # Columna Z - Calculada (Alerta Inicio Proceso)
                'Alerta Inicio Proceso': contract.process_start_alert,
                
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
                '% de Avance': contract.progress_percentage,
                'Duración SLA': contract.sla_duration,
                'Completitud general': contract.general_completeness
            }
            
            # Agregar datos adicionales si existen
            if contract.additional_data:
                additional_data = json.loads(contract.additional_data)
                for key, value in additional_data.items():
                    contract_data[key] = value
            
            data.append(contract_data)
        
        # Crear DataFrame y exportar a Excel
        df = pd.DataFrame(data)
        
        # Crear una copia backup en la carpeta backup
        backup_dir = Path("./backups")
        backup_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = backup_dir / f"sourcing_plan_backup_{timestamp}.xlsx"
        
        # Guardar en archivo temporal para la descarga
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
        df.to_excel(temp_file.name, index=False, engine='openpyxl')
        
        # Guardar también una copia de backup
        df.to_excel(backup_path, index=False, engine='openpyxl')
        
        return temp_file.name
    
    except Exception as e:
        raise e