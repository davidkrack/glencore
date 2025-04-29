"""
Script simplificado para crear un usuario administrador en la base de datos.
Ejecutar desde la raíz del proyecto backend:
python scripts/create_admin_simple.py
"""

import sys
import os
from pathlib import Path

# Añadir el directorio padre al path para poder importar app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
import os

# Obtener la ruta absoluta del directorio del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
# Construir la ruta absoluta al archivo de la base de datos
DATABASE_PATH = os.path.join(BASE_DIR, "database", "sourcing.db")
# Asegurarse de que el directorio database existe
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

# Construir la URL para SQLAlchemy usando la ruta absoluta
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

print(f"Database path: {DATABASE_PATH}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Importar Usuario después de configurar la base de datos
from app.models.user import User

def create_admin_user():
    # Crear una sesión
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un admin
        admin = db.query(User).filter(User.is_admin == True).first()
        if admin:
            print(f"Ya existe un usuario administrador: {admin.username}")
            return
        
        # Usar valores específicos sin solicitar entrada
        username = "david.candia"
        email = "david.candia@glencore.cl"
        full_name = "David Candia"
        password = "admin2025"
        
        # Crear usuario administrador
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            is_admin=True
        )
        
        # Guardar en la base de datos
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Usuario administrador '{username}' creado exitosamente.")
    
    except Exception as e:
        print(f"Error al crear usuario: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()