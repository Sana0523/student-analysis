from flask import Flask,request,jsonify
import sys
import json
import joblib
import pandas as pd
app = Flask(__name__)
try:
  model=joblib.load('linear_regression_model.pkl')
  grade_scaler=joblib.load('grade_scaler.pkl')
except FileNotFoundError as e:
    print(json.dumps({'success':False, 'message':f'Model or scaler failed: {str(e)}'}))
    sys.exit()
def predict(input_data,max_marks):
  required_features=['age','failures','absences','studytime','G1','G2']
  try:
    if not all(key in input_data for key in required_features):
      missing_keys=[key for key in required_features if key not in input_data]
      return {'success': False, 'message': f'Missing required features: {missing_keys}'}
    input_df=pd.DataFrame([input_data],columns=required_features)
    scaled_prediction=model.predict(input_df)
    original_prediction = grade_scaler.inverse_transform(scaled_prediction.reshape(-1, 1))
    
    # FIX for 503% Bug: Clamp final_grade to valid range [0, 20]
    # The ML model (linear regression) can extrapolate beyond training bounds,
    # producing values outside the Portuguese grading scale (0-20).
    # Without clamping, values like 100.6 would become (100.6/20)*100 = 503%
    raw_grade = original_prediction[0][0]
    final_grade = max(0, min(20, raw_grade))
    
    # Scale to the requested max_marks (typically 100)
    predicted_grade_on_new_scale = (final_grade / 20) * max_marks
    
    # Additional validation: ensure percentage never exceeds 100%
    predicted_grade_on_new_scale = min(predicted_grade_on_new_scale, max_marks)
    
    if final_grade < 10:
      risk_level = "High"
    elif final_grade < 14:
      risk_level = "Medium"
    else:
      risk_level = "Low"
        
    return {
      'success': True,
      'predicted_grade': f"{predicted_grade_on_new_scale:.2f}",
      'risk_level': risk_level,
    }
  except Exception as e:
    print(f"PRediction error: {e}")
    return {'success':False,'message':str(e)}

@app.route('/predict', methods=['POST'])
def predict_endpoint():
  """Recieves student data and returns grade prediction and risk level."""
  if not request.is_json:
    return jsonify({'success': False, 'message': 'Request must be json'}),400
  data=request.get_json()
  if 'student_data' not in data or 'max_marks' not in data:
        return jsonify({'success': False, 'message': 'Missing student_data or max_marks in request'}), 400
    
  student_data=data['student_data']
  max_marks=data['max_marks']
  result =predict(student_data,max_marks)
  if result.get('success'):
    return jsonify(result)
  else:
    return jsonify(result),500

if __name__ == '__main__':
  app.run(host='0.0.0.0',port=5000,debug=True)
