from flask import Flask,request,jsonify
import sys
import json
import joblib
import pandas as pd
import numpy as np
import shap

app = Flask(__name__)

# Load model and scalers
try:
  model=joblib.load('linear_regression_model.pkl')
  grade_scaler=joblib.load('grade_scaler.pkl')
except FileNotFoundError as e:
    print(json.dumps({'success':False, 'message':f'Model or scaler failed: {str(e)}'}))
    sys.exit()

# Load X_train for SHAP explainer (with fallback)
try:
  X_train = joblib.load('x_train.pkl')
  shap_explainer = shap.LinearExplainer(model, X_train)
  print("SHAP explainer initialized successfully")
except FileNotFoundError:
  X_train = None
  shap_explainer = None
  print("Warning: x_train.pkl not found. SHAP explanations will be unavailable.")
  print("Run grade_prediction.py to generate x_train.pkl")
def calculate_shap_explanation(input_df, final_grade, risk_level):
  """Calculate SHAP values and generate human-readable explanations."""
  if shap_explainer is None:
    return None
  
  feature_names = ['age', 'failures', 'absences', 'studytime', 'G1', 'G2']
  feature_display_names = {
    'age': 'Age',
    'failures': 'Past Failures',
    'absences': 'Absences',
    'studytime': 'Study Time',
    'G1': 'First Period Grade',
    'G2': 'Second Period Grade'
  }
  
  try:
    # Calculate SHAP values
    shap_values = shap_explainer.shap_values(input_df)
    
    # Handle both 1D and 2D shap_values arrays
    if len(shap_values.shape) == 1:
      shap_vals = shap_values
    else:
      shap_vals = shap_values[0]
    
    # Build feature contributions list
    feature_contributions = []
    for i, feature in enumerate(feature_names):
      shap_val = float(shap_vals[i])
      input_value = float(input_df.iloc[0][feature])
      
      # Avoid division by zero
      safe_grade = max(abs(final_grade), 0.001)
      contribution_pct = (shap_val / safe_grade) * 100
      
      # Clamp contribution percentage to [-100%, +100%]
      contribution_pct = max(-100, min(100, contribution_pct))
      
      feature_contributions.append({
        'factor': feature_display_names.get(feature, feature.replace('_', ' ').title()),
        'value': input_value,
        'shap_value': round(shap_val, 3),
        'impact': 'positive' if shap_val > 0 else 'negative',
        'contribution_percentage': f"{contribution_pct:+.1f}%"
      })
    
    # Sort by absolute SHAP value (most impactful first)
    top_factors = sorted(
      feature_contributions,
      key=lambda x: abs(x['shap_value']),
      reverse=True
    )[:5]
    
    # Generate human-readable summary
    risk_factors = [f for f in top_factors if f['impact'] == 'negative']
    summary = f"{risk_level} Risk"
    if risk_factors:
      main_factors = ', '.join(
        [f"{f['factor']} ({f['value']})" for f in risk_factors[:2]]
      )
      summary += f": Primary concerns are {main_factors}"
    elif risk_level == "Low":
      positive_factors = [f for f in top_factors if f['impact'] == 'positive'][:2]
      if positive_factors:
        main_factors = ', '.join(
          [f"{f['factor']} ({f['value']})" for f in positive_factors]
        )
        summary += f": Strengths include {main_factors}"
    
    return {
      'summary': summary,
      'top_factors': top_factors
    }
  except Exception as e:
    print(f"SHAP calculation error: {e}")
    return None


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
    
    # Calculate SHAP explanation
    explanation = calculate_shap_explanation(input_df, final_grade, risk_level)
    
    result = {
      'success': True,
      'predicted_grade': f"{predicted_grade_on_new_scale:.2f}",
      'risk_level': risk_level,
    }
    
    if explanation:
      result['explanation'] = explanation
    
    return result
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
