import os
from pydantic_settings import BaseSettings
from pathlib import Path

# Determine the base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

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