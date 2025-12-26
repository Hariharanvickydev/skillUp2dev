#!/usr/bin/env python3
"""
Script to delete all cloned questions from the database.
This removes all ImportantQuestions that have a source_question_id set.
"""

import requests
import sys

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = f"{BASE_URL}/auth/login"
DELETE_ENDPOINT = f"{BASE_URL}/library/questions/cloned"

# Super Admin credentials (update these if needed)
SUPER_ADMIN_EMAIL = "admin@skillup2dev.com"
SUPER_ADMIN_PASSWORD = "admin123"

def get_auth_token():
    """Login and get authentication token"""
    print("🔐 Logging in as Super Admin...")
    
    response = requests.post(
        LOGIN_ENDPOINT,
        data={
            "username": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        }
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        sys.exit(1)
    
    token_data = response.json()
    print("✅ Login successful")
    return token_data["access_token"]

def delete_cloned_questions(token):
    """Delete all cloned questions"""
    print("\n🗑️  Deleting all cloned questions...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.delete(DELETE_ENDPOINT, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Delete failed: {response.text}")
        sys.exit(1)
    
    result = response.json()
    print(f"✅ {result['message']}")
    print(f"📊 Total deleted: {result['count']}")
    
    return result

if __name__ == "__main__":
    print("=" * 60)
    print("Delete All Cloned Questions")
    print("=" * 60)
    
    # Get authentication token
    token = get_auth_token()
    
    # Delete cloned questions
    result = delete_cloned_questions(token)
    
    print("\n" + "=" * 60)
    print("✨ Operation completed successfully!")
    print("=" * 60)
