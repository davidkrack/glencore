from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Obtener la ruta absoluta del directorio del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent
# Construir la ruta absoluta al archivo de la base de datos
DATABASE_PATH = os.path.join(BASE_DIR, "database", "sourcing.db")
# Asegurarse de que el directorio database existe
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

# Construir la URL para SQLAlchemy usando la ruta absoluta
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

print(f"Database path: {DATABASE_PATH}")  # Para depuración

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()