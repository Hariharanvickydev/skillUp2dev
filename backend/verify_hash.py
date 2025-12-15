
import os
import sys

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.auth import hash_password
    print("Import successful.")
    hashed = hash_password("test1234")
    print(f"Hash generated: {hashed[:10]}...")
except Exception as e:
    print(f"Import failed: {e}")
