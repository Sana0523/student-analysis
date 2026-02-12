from flask import Flask,request,jsonify
from flask_cors import CORS
import sys
import json
import os
import joblib
import pandas as pd
import numpy as np
import shap

app = Flask(__name__)
CORS(app)  # Allow Next.js API to call Flask

# Change working directory to ml-service folder so .pkl files are found
os.chdir(os.path.dirname(os.path.abspath(__file__)))

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


@app.route('/model-metrics', methods=['GET'])
def get_model_metrics():
    """
    Return performance metrics for all trained models
    """
    try:
        if not os.path.exists('model_metrics.json'):
            return jsonify({
                'error': 'Models not trained yet. Run train_all_models.py first.'
            }), 404
        
        with open('model_metrics.json', 'r') as f:
            metrics = json.load(f)
        
        return jsonify(metrics), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict-with-model', methods=['POST'])
def predict_with_model():
    """
    Make prediction using a specified model
    Request body:
    {
        "student_data": {...},
        "max_marks": 100,
        "model": "linear_regression" | "random_forest" | "xgboost"
    }
    """
    try:
        data = request.json
        
        # Get model selection (default to linear_regression)
        model_name = data.get('model', 'linear_regression')
        
        # Validate model name
        valid_models = ['linear_regression', 'random_forest', 'xgboost']
        if model_name not in valid_models:
            return jsonify({
                'error': f'Invalid model. Choose from: {valid_models}'
            }), 400
        
        # Load selected model
        model_filename = f'{model_name}_model.pkl'
        
        if not os.path.exists(model_filename):
            return jsonify({
                'error': f'Model {model_name} not found. Run train_all_models.py first.'
            }), 404
        
        selected_model = joblib.load(model_filename)
        
        # Make prediction
        student_data = data.get('student_data', {})
        max_marks = data.get('max_marks', 100)
        
        # Prepare input array
        feature_names = ['age', 'failures', 'absences', 'studytime', 'G1', 'G2']
        input_array = np.array([[
            student_data.get('age', 16),
            student_data.get('failures', 0),
            student_data.get('absences', 0),
            student_data.get('studytime', 2),
            student_data.get('G1', 10),
            student_data.get('G2', 10)
        ]])
        input_df = pd.DataFrame(input_array, columns=feature_names)
        
        # Predict (scaled)
        scaled_prediction = selected_model.predict(input_df)
        
        # Inverse transform to get grade on 0-20 scale
        original_prediction = grade_scaler.inverse_transform(scaled_prediction.reshape(-1, 1))
        final_grade = original_prediction[0][0]
        
        # Clamp to valid range
        final_grade = max(0, min(20, final_grade))
        
        # Scale to max_marks
        predicted_grade_on_new_scale = (final_grade / 20) * max_marks
        predicted_grade_on_new_scale = min(predicted_grade_on_new_scale, max_marks)
        
        # Calculate risk level
        if final_grade < 10:
            risk_level = "High"
        elif final_grade < 14:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # SHAP explanation
        try:
            if model_name == 'linear_regression':
                explainer = shap.LinearExplainer(selected_model, X_train)
            else:
                explainer = shap.Explainer(selected_model, X_train)
            shap_values = explainer.shap_values(input_df)
            
            # Handle both 1D and 2D shap_values arrays
            if len(shap_values.shape) == 1:
                shap_vals = shap_values
            else:
                shap_vals = shap_values[0]
            
            feature_display_names = {
                'age': 'Age',
                'failures': 'Past Failures',
                'absences': 'Absences',
                'studytime': 'Study Time',
                'G1': 'First Period Grade',
                'G2': 'Second Period Grade'
            }
            
            feature_contributions = []
            for i, feature in enumerate(feature_names):
                shap_val = float(shap_vals[i])
                feature_value = float(input_df.iloc[0][feature])
                
                base_value = max(abs(final_grade), 0.1)
                contribution_pct = (shap_val / base_value) * 100
                contribution_pct = max(-100, min(100, contribution_pct))
                impact = 'positive' if shap_val > 0 else 'negative'
                
                descriptions = {
                    'age': f"Age {int(feature_value)} years",
                    'studytime': f"Study time level {int(feature_value)}/4",
                    'failures': f"{int(feature_value)} previous failures" if feature_value > 0 else "No previous failures",
                    'absences': f"{int(feature_value)} absences" + (" (high)" if feature_value > 10 else " (acceptable)" if feature_value > 5 else " (excellent)"),
                    'G1': f"Period 1 grade: {feature_value}/20",
                    'G2': f"Period 2 grade: {feature_value}/20"
                }
                
                feature_contributions.append({
                    'factor': feature_display_names.get(feature, feature.replace('_', ' ').title()),
                    'value': feature_value,
                    'shap_value': round(shap_val, 3),
                    'impact': impact,
                    'contribution_percentage': f"{contribution_pct:+.1f}%",
                    'description': descriptions.get(feature, f"Value: {feature_value}")
                })
            
            top_factors = sorted(feature_contributions, key=lambda x: abs(x['shap_value']), reverse=True)[:5]
            
            negative_factors = [f for f in top_factors if f['impact'] == 'negative']
            summary = f"{risk_level} Risk"
            if negative_factors:
                concerns = ', '.join([f"{f['factor']} ({f['value']})" for f in negative_factors[:2]])
                summary += f": Primary concerns are {concerns}"
            
            explanation = {
                'summary': summary,
                'top_factors': top_factors
            }
        except Exception as e:
            print(f"SHAP calculation failed: {str(e)}")
            explanation = {
                'summary': f"{risk_level} Risk",
                'top_factors': [],
                'error': 'Feature importance calculation unavailable'
            }
        
        # Return response
        return jsonify({
            'success': True,
            'predicted_grade': f"{predicted_grade_on_new_scale:.2f}",
            'risk_level': risk_level,
            'explanation': explanation,
            'model_used': model_name,
            'model_version': 'v1.0'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/simulate', methods=['POST'])
def simulate():
    """
    What-If simulation endpoint
    Identical to predict-with-model but marks response as simulation
    
    Request body:
    {
        "student_data": {
            "age": 16,
            "studytime": 5,
            "failures": 1,
            "absences": 3,
            "G1": 10,
            "G2": 11
        },
        "max_marks": 100,
        "model": "random_forest"
    }
    """
    try:
        # Reuse predict-with-model logic
        data = request.json
        model_name = data.get('model', 'linear_regression')
        
        # Validate
        valid_models = ['linear_regression', 'random_forest', 'xgboost']
        if model_name not in valid_models:
            return jsonify({'error': f'Invalid model. Choose from: {valid_models}'}), 400
        
        # Load model
        model_filename = f'{model_name}_model.pkl'
        if not os.path.exists(model_filename):
            return jsonify({'error': f'Model {model_name} not found'}), 404
        
        selected_model = joblib.load(model_filename)
        
        # Make prediction
        student_data = data.get('student_data', {})
        max_marks = data.get('max_marks', 100)
        
        feature_names = ['age', 'failures', 'absences', 'studytime', 'G1', 'G2']
        input_array = np.array([[
            student_data.get('age', 16),
            student_data.get('failures', 0),
            student_data.get('absences', 0),
            student_data.get('studytime', 2),
            student_data.get('G1', 10),
            student_data.get('G2', 10)
        ]])
        input_df = pd.DataFrame(input_array, columns=feature_names)
        
        # Predict
        scaled_prediction = selected_model.predict(input_df)
        original_prediction = grade_scaler.inverse_transform(scaled_prediction.reshape(-1, 1))
        final_grade = max(0, min(20, original_prediction[0][0]))
        predicted_grade_on_new_scale = (final_grade / 20) * max_marks
        predicted_grade_on_new_scale = min(predicted_grade_on_new_scale, max_marks)
        
        # Risk level
        risk_level = "High" if final_grade < 10 else "Medium" if final_grade < 14 else "Low"
        
        # Return with simulation flag
        return jsonify({
            'success': True,
            'predicted_grade': f"{predicted_grade_on_new_scale:.2f}",
            'risk_level': risk_level,
            'is_simulation': True,
            'model_used': model_name
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("="*60)
    print("STUDENT GRADE PREDICTION API")
    print("="*60)
    print("\nAvailable endpoints:")
    print("  POST   /predict              - Original prediction endpoint")
    print("  POST   /predict-with-model   - Predict with model selection")
    print("  POST   /simulate             - What-If simulation")
    print("  GET    /model-metrics        - Get all model metrics")
    print("\nStarting Flask server...")
    print("="*60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
