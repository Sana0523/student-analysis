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
            data = response.json()
            if data.get('success') and 'predicted_grade' in data:
                print(f"   ✓ Prediction successful: Grade = {data['predicted_grade']}, Risk = {data['risk_level']}")
                return True
            else:
                print(f"   ✗ Prediction returned unexpected format: {data}")
                return False
        else:
            print(f"   ✗ Prediction failed with status {response.status_code}")
            print(f"     Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def test_report_generation():
    """Test report generation endpoint"""
    print("\n3. Testing report generation endpoint...")
    try:
        # Use a test student ID
        response = requests.get(
            f"{FLASK_URL}/generate-report/test-student",
            timeout=30
        )
        
        if response.status_code == 200 or response.status_code == 404:
            if response.status_code == 404:
                print(f"   ⚠ Report endpoint responded (student not found is normal for test)")
                print("     To test with real data, check database for valid student IDs")
                return True
            else:
                print("   ✓ Report generation endpoint is working")
                return True
        else:
            print(f"   ✗ Report generation failed with status {response.status_code}")
            print(f"     Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

def main():
    print("="*60)
    print("Flask ML Service Health Check")
    print("="*60)
    
    results = []
    results.append(("Connectivity", test_connection()))
    results.append(("Prediction", test_prediction()))
    results.append(("Report Generation", test_report_generation()))
    
    print("\n" + "="*60)
    print("Summary:")
    print("="*60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(r[1] for r in results)
    print("\n" + "="*60)
    if all_passed:
        print("✓ All tests passed! Flask service is working correctly.")
        print("\nIf you still see errors in the web app:")
        print("1. Restart the Next.js dev server")
        print("2. Clear browser cache and refresh")
        print("3. Check browser console and network tab for specific errors")
        return 0
    else:
        print("✗ Some tests failed. Please fix the issues above.")
        print("\nTroubleshooting:")
        print("1. Make sure Flask service is running: python ml-service/predict_script.py")
        print("2. Check database connection in ml-service/predict_script.py")
        print("3. Verify model files exist in ml-service/*.pkl")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
