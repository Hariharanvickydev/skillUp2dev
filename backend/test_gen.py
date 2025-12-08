from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

candidates = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-1.0-pro-latest",
    "models/gemini-2.0-flash-exp"
]

for name in candidates:
    print(f"Trying: {name}")
    try:
        model = genai.GenerativeModel(name)
        response = model.generate_content("Hello")
        print(f"SUCCESS with {name}!")
        break
    except Exception as e:
        print(f"FAILED {name}: {e}")
