from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, contracts, excel, sharepoint
from app.core.database import engine, Base
from app.models import user, contract  # Importamos los modelos para que se registren con Base
from app.core.config import settings

# Crear tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sourcing Plan API",
    description="API para gestionar el Sourcing Plan de contratos",
    version="1.0.0"
)

# Configurar CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(contracts.router)
app.include_router(excel.router)
app.include_router(sharepoint.router)

@app.get("/")
def read_root():
    return {
        "message": "Bienvenido a la API del Sourcing Plan",
        "version": "1.0.0"
    }