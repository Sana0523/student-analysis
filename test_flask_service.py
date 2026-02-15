"""
Flask Service Health Check Script
Run this to verify the Flask ML service is working correctly
"""

import requests
import json
import sys

FLASK_URL = "http://localhost:5000"

def test_connection():
    """Test basic connectivity to Flask service"""
    print("1. Testing Flask service connectivity...")
    try:
        response = requests.get(f"{FLASK_URL}/model-metrics", timeout=5)
        if response.status_code == 200:
            print("   ✓ Flask service is running and accessible")
            return True
        else:
            print(f"   ✗ Flask service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to Flask service. Is it running?")
        print("     Run: cd ml-service && python predict_script.py")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print("\n2. Testing prediction endpoint...")
    try:
        test_data = {
            "student_data": {
                "age": 16,
                "failures": 0,
                "studytime": 5,
                "absences": 2,
                "G1": 15,
                "G2": 14
            },
            "max_marks": 100
        }
        
        response = requests.post(
            f"{FLASK_URL}/predict",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200: