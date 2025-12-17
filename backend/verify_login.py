from app.database import SessionLocal
from app.models import User
from app.auth import verify_password, hash_password

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@skillup2dev.com').first()

if not user:
    print("User not found!")
else:
    print(f"User found: {user.email}")
    print(f"Stored Hash: {user.password_hash}")
    
    # Test verification
    is_valid = verify_password('password123', user.password_hash)
    print(f"Password 'password123' valid? {is_valid}")
    
    if not is_valid:
        print("Re-hashing password...")
        new_hash = hash_password('password123')
        user.password_hash = new_hash
        db.commit()
        print("Password updated. Verifying again:")
        is_valid_retry = verify_password('password123', new_hash)
        print(f"Retry valid? {is_valid_retry}")

db.close()
