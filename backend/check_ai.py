from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY is missing or empty in .env")
else:
    print(f"SUCCESS: GEMINI_API_KEY found (starts with {api_key[:4]}...)")
    try:
        genai.configure(api_key=api_key)
        print("Listing available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"ERROR connecting to Gemini: {e}")
