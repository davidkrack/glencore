"""
Script para insertar un usuario administrador directamente en la base de datos SQLite
sin depender de los modelos de SQLAlchemy.
"""

import sqlite3
import os
import sys
from pathlib import Path
from datetime import datetime

# Añadir el directorio padre al path para poder importar app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Importamos solo la función para el hash de la contraseña
from app.core.security import get_password_hash

# Obtener la ruta absoluta del directorio del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
# Construir la ruta absoluta al archivo de la base de datos
DATABASE_PATH = os.path.join(BASE_DIR, "database", "sourcing.db")

# Datos del administrador
username = "david.candia"
email = "david.candia@glencore.cl"
full_name = "David Candia"
password = "admin2025"
hashed_password = get_password_hash(password)
is_active = True
is_admin = True
created_at = datetime.utcnow().isoformat()
updated_at = created_at

print(f"Database path: {DATABASE_PATH}")

try:
    # Verificar si la base de datos existe
    if not os.path.exists(DATABASE_PATH):
        print("La base de datos no existe. Asegúrate de que el servidor backend haya creado las tablas.")
        sys.exit(1)

    # Conectar a la base de datos
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Verificar si la tabla users existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("La tabla 'users' no existe. Ejecuta primero el servidor backend para crear las tablas.")
        conn.close()
        sys.exit(1)
    
    # Verificar si ya existe un usuario administrador
    cursor.execute("SELECT username FROM users WHERE is_admin = 1")
    admin = cursor.fetchone()
    if admin:
        print(f"Ya existe un usuario administrador: {admin[0]}")
        conn.close()
        sys.exit(0)
    
    # Insertar el usuario administrador
    cursor.execute(
        """
        INSERT INTO users 
        (username, email, full_name, hashed_password, is_active, is_admin, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (username, email, full_name, hashed_password, is_active, is_admin, created_at, updated_at)
    )
    
    # Guardar cambios
    conn.commit()
    print(f"Usuario administrador '{username}' creado exitosamente.")
    
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1)
finally:
    if 'conn' in locals():
        conn.close()