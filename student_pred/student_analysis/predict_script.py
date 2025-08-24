import sys
import json
import joblib
import pandas as pd
try:
  model=joblib.load('linear_model.pkl')
  grade_scaler=joblib.load('grade_scaler.pkl')
except FileNotFoundError:
  print(json.dumps({'success':False, 'message':'Model or scaler failed'}))
  sys.exit()
def predict(input_data,max_marks):
  required_features=['age','failures','studytime','absences','G1','G2']
  input_df=pd.DataFrame([input_data],columns=required_features)
  scaled_prediction=model.predict(input_df)
  original_prediction = grade_scaler.inverse_transform(scaled_prediction.reshape(-1, 1))
  final_grade = original_prediction[0][0]
  predicted_grade_on_new_scale = (final_grade / 20) * max_marks
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

if __name__ == '__main__':
  try:
    input_data_list = json.loads(sys.argv[1])
    max_marks = float(sys.argv[2])
    result = predict(input_data_list, max_marks)
    print(json.dumps(result))
  except Exception as e:
    print(json.dumps({'success': False, 'message': str(e)}))
    sys.exit(1)
