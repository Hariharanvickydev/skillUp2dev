import requests
import sys

try:
    print("Attempting to connect to http://localhost:8000/...")
    response = requests.get("http://localhost:8000/", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except requests.exceptions.Timeout:
    print("Timeout! Server is hanging.")
except requests.exceptions.ConnectionError:
    print("Connection Error! Server might be down.")
except Exception as e:
    print(f"Error: {e}")
