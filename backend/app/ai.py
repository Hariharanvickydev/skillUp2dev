import os
import json
import logging
import requests
import google.generativeai as genai
from groq import Groq
from openai import OpenAI
from fastapi import HTTPException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Providers
PROVIDER_GEMINI = "gemini"
PROVIDER_GROQ = "groq"
PROVIDER_OLLAMA = "ollama"
PROVIDER_OPENAI = "openai"

# Models
MODEL_GEMINI = "gemini-2.0-flash-exp" # Reverted to Experimental as requested
MODEL_GROQ = "llama3-8b-8192"
MODEL_OLLAMA = "llama3"
MODEL_OPENAI = "gpt-4o"

class AIResponse:
    """Standardized response object for all providers."""
    def __init__(self, text):
        self.text = text

class BaseProvider:
    """Interface for AI Providers."""
    def generate_content(self, prompt: str) -> AIResponse:
        raise NotImplementedError

class GeminiProvider(BaseProvider):
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(MODEL_GEMINI)
        self.model_name = MODEL_GEMINI

    def generate_content(self, prompt: str) -> AIResponse:
        try:
            response = self.model.generate_content(prompt)
            return AIResponse(response.text)
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise e

class GroqProvider(BaseProvider):
    def __init__(self, api_key):
        self.client = Groq(api_key=api_key)
        self.model_name = MODEL_GROQ

    def generate_content(self, prompt: str) -> AIResponse:
        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=4096,
                top_p=1,
                stream=False,
                stop=None,
            )
            return AIResponse(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise e

class OllamaProvider(BaseProvider):
    def __init__(self, base_url="http://localhost:11434"):
        self.base_url = base_url
        self.model_name = MODEL_OLLAMA

    def generate_content(self, prompt: str) -> AIResponse:
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False
            }
            response = requests.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            return AIResponse(data.get("response", ""))
        except requests.exceptions.ConnectionError:
            raise Exception("Ollama is not running. Please run 'ollama serve' or start the Ollama app.")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise e

class OpenAIProvider(BaseProvider):
    def __init__(self, api_key):
        self.client = OpenAI(api_key=api_key)
        self.model_name = MODEL_OPENAI

    def generate_content(self, prompt: str) -> AIResponse:
        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4096,
            )
            return AIResponse(completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise e

def get_ai_model():
    """
    Factory function to return the configured AI Provider.
    """
    provider = os.getenv("AI_PROVIDER", PROVIDER_GEMINI).lower()
    
    if provider == PROVIDER_GROQ:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        return GroqProvider(api_key)

    elif provider == PROVIDER_OPENAI:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        return OpenAIProvider(api_key)
        
    elif provider == PROVIDER_OLLAMA:
        return OllamaProvider()
        
    else: # Default to Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
             if provider == PROVIDER_GEMINI:
                 raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
             raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
             
        return GeminiProvider(api_key)
