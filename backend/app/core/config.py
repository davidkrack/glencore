import os
import json
from pydantic_settings import BaseSettings
from pathlib import Path

# Determine the base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
SHAREPOINT_CONFIG_FILE = CONFIG_DIR / "sharepoint_config.json"

# Funciones para manejar la configuración de SharePoint
def save_sharepoint_config(config_data):
    """Guarda la configuración de SharePoint en un archivo local"""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(SHAREPOINT_CONFIG_FILE, 'w') as f:
        json.dump(config_data, f)
        
    # También actualizar variables de entorno en tiempo de ejecución
    for key, value in config_data.items():
        env_key = f"SHAREPOINT_{key.upper()}" if not key.startswith("SHAREPOINT_") else key
        os.environ[env_key] = str(value)

def load_sharepoint_config():
    """Carga la configuración de SharePoint desde el archivo local"""
    if not os.path.exists(SHAREPOINT_CONFIG_FILE):
        return {}
    try:
        with open(SHAREPOINT_CONFIG_FILE, 'r') as f:
            config = json.load(f)
            
            # Actualizar variables de entorno con la configuración cargada
            for key, value in config.items():
                env_key = f"SHAREPOINT_{key.upper()}" if not key.startswith("SHAREPOINT_") else key
                os.environ[env_key] = str(value)
                
            return config
    except Exception as e:
        print(f"Error al cargar configuración de SharePoint: {e}")
        return {}

# Cargar configuración al inicio
load_sharepoint_config()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tu_clave_secreta_muy_segura_cambiame_en_produccion")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/database/sourcing.db")
    
    # CORS settings
    CORS_ORIGINS: list = [
        "http://localhost",
        "http://localhost:3000",
    ]
    
    # SharePoint settings - API original
    SHAREPOINT_SITE_URL: str = os.getenv("SHAREPOINT_SITE_URL", "")
    SHAREPOINT_USERNAME: str = os.getenv("SHAREPOINT_USERNAME", "")
    SHAREPOINT_PASSWORD: str = os.getenv("SHAREPOINT_PASSWORD", "")
    SHAREPOINT_EXCEL_PATH: str = os.getenv("SHAREPOINT_EXCEL_PATH", "/sites/TuSitio/Documentos Compartidos/Sourcing Plan Glencore.xlsx")
    
    # SharePoint settings - Enlace directo
    SHAREPOINT_SHARED_LINK: str = os.getenv("SHAREPOINT_SHARED_LINK", "")
    
    # Sync settings
    AUTO_SYNC_ENABLED: bool = os.getenv("AUTO_SYNC_ENABLED", "False").lower() == "true"
    AUTO_SYNC_INTERVAL_MINUTES: int = int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", "60"))
    
    class Config:
        env_file = ".env"
        # En Pydantic V2, podemos usar extra="allow" para permitir campos adicionales
        extra = "allow"

settings = Settings()