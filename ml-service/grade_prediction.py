import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

print("Training the model...")
df=pd.read_csv(r"C:\Users\sanaf\OneDrive\Documents\student-mat.csv",sep=';')
from sklearn.preprocessing import MinMaxScaler
req_df=df[['age','failures','absences','studytime','G1','G2','G3']]
req_df.head(1)
x=req_df[['age','failures','absences','studytime','G1','G2']]
y=req_df[['G3']]
grade_scaler=MinMaxScaler()
y_scaled = grade_scaler.fit_transform(y.values.reshape(-1, 1))
x_train,x_test,y_train,y_test=train_test_split(x,y_scaled,test_size=0.2,random_state=42)
model=LinearRegression()
model.fit(x_train,y_train)
model_filename = 'linear_regression_model.pkl'
scaler_filename = 'grade_scaler.pkl'
x_train_filename = 'x_train.pkl'
joblib.dump(model, model_filename)
joblib.dump(grade_scaler, scaler_filename)
joblib.dump(x_train, x_train_filename)
print(f"Saved X_train for SHAP explainability: {x_train_filename}")
