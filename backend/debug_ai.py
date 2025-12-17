import sys
import os
import google.generativeai as genai

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("1. Attempting to import app.ai...")
    from app.ai import get_ai_model
    print("   SUCCESS: app.ai imported.")
except ImportError as e:
    print(f"   FATAL ERROR: Could not import app.ai: {e}")
    sys.exit(1)

try:
    print("2. Attempting to initialize AI model...")
    model = get_ai_model()
    # Check for provider identity (custom property I added to providers) 
    # Actually I added 'model_name' to providers, so let's print that
    print(f"   SUCCESS: Initialized Adapter. Active Model: {model.model_name}")
    print(f"   (Provider Class: {model.__class__.__name__})")
except Exception as e:
    print(f"   FATAL ERROR: Could not initialize model: {e}")
    sys.exit(1)

try:
    print("3. Attempting to generate content (Test)...")
    response = model.generate_content("Say 'OK' if you can hear me.")
    print(f"   SUCCESS: Generation worked!")
    print(f"   RESPONSE: {response.text}")
except Exception as e:
    print(f"   FATAL ERROR: Generation failed: {e}")
    sys.exit(1)
