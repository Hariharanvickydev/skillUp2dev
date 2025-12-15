
import requests
import json

BASE_URL = "http://localhost:8000"

users_to_test = [
    {"email": "admin@skillup2dev.com", "password": "admin123", "expected_role": "SUPER_ADMIN"},
    {"email": "dean@skillup.edu", "password": "dean123", "expected_role": "ORG_ADMIN"},
    {"email": "teacher@skillup.edu", "password": "teacher123", "expected_role": "TEACHER"},
    {"email": "student@skillup.edu", "password": "student123", "expected_role": "STUDENT"},
]

def test_login():
    print(f"Testing Login against {BASE_URL}...\n")
    all_passed = True
    
    for user in users_to_test:
        print(f"Testing {user['email']}...")
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                data={"username": user['email'], "password": user['password']}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"  [SUCCESS] Token received.")
                
                # Check /me to verify context
                headers = {"Authorization": f"Bearer {token_data['access_token']}"}
                me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
                
                if me_res.status_code == 200:
                    user_info = me_res.json()
                    role = user_info.get('role')
                    print(f"  [VERIFIED] Role: {role}")
                    
                    if role != user['expected_role']:
                        print(f"  [ERROR] Expected {user['expected_role']}, got {role}")
                        all_passed = False
                        
                    # Check nested info
                    if 'organization' in user_info and user_info['organization']:
                        print(f"  [INFO] Organization: {user_info['organization']['name']}")
                    if 'department' in user_info and user_info['department']:
                         print(f"  [INFO] Department: {user_info['department']['name']}")
                         
                else:
                    print(f"  [ERROR] Failed to fetch /me: {me_res.text}")
                    all_passed = False
            else:
                print(f"  [FAIL] Status {response.status_code}: {response.text}")
                all_passed = False
                
        except Exception as e:
            print(f"  [EXCEPTION] {e}")
            all_passed = False
        print("-" * 30)

    if all_passed:
        print("\n✅ All V2 Roles Verified Successfully!")
    else:
        print("\n❌ Some tests failed.")

if __name__ == "__main__":
    test_login()
