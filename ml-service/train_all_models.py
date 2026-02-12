"""
Train multiple ML models for grade prediction comparison
Models: Linear Regression, Random Forest, XGBoost
"""

import numpy as np
import pandas as pd
import joblib
import json
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

def train_all_models(dataset_path='student-mat.csv'):
    """
    Train all three models and save them with performance metrics
    """
    print("="*60)
    print("MULTI-MODEL TRAINING PIPELINE")
    print("="*60)
    
    # Load dataset
    print("\n1. Loading dataset...")
    df = pd.read_csv(dataset_path, sep=';')
    print(f"   Dataset shape: {df.shape}")
    
    # Prepare features
    print("\n2. Preparing features...")
    features = ['age', 'failures', 'absences', 'studytime', 'G1', 'G2']
    target = 'G3'
    
    X = df[features]
    y = df[[target]]
    
    print(f"   Features: {features}")
    print(f"   Target: {target}")
    
    # Scale target variable (0-20 scale)
    grade_scaler = MinMaxScaler()
    y_scaled = grade_scaler.fit_transform(y.values.reshape(-1, 1))
    
    # Train/test split
    print("\n3. Splitting data (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_scaled, test_size=0.2, random_state=42
    )
    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples: {len(X_test)}")
    
    # Define models
    models = {
        'linear_regression': {
            'model': LinearRegression(),
            'name': 'Linear Regression',
            'description': 'Fast, interpretable baseline'
        },
        'random_forest': {
            'model': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                n_jobs=-1
            ),
            'name': 'Random Forest',
            'description': 'Handles non-linear patterns'
        },
        'xgboost': {
            'model': XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                verbosity=0
            ),
            'name': 'XGBoost',
            'description': 'Highest accuracy, gradient boosting'
        }
    }
    
    # Train and evaluate each model
    print("\n4. Training models...")
    print("-"*60)
    
    metrics = {}
    
    for model_id, model_info in models.items():
        print(f"\n   Training: {model_info['name']}")
        print(f"   Description: {model_info['description']}")
        
        model = model_info['model']
        
        # Train
        model.fit(X_train, y_train.ravel())
        
        # Predict
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)
        
        # Calculate metrics
        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        
        metrics[model_id] = {
            'name': model_info['name'],
            'description': model_info['description'],
            'r2_score': round(float(test_r2), 4),
            'mae': round(float(test_mae), 4),
            'rmse': round(float(test_rmse), 4),
            'train_r2': round(float(train_r2), 4)
        }
        
        # Save model
        model_filename = f'{model_id}_model.pkl'
        joblib.dump(model, model_filename)
        
        print(f"   Trained | R2 (test): {test_r2:.4f} | MAE: {test_mae:.4f}")
        print(f"   Saved: {model_filename}")
    
    # Save grade scaler (same for all models)
    joblib.dump(grade_scaler, 'grade_scaler.pkl')
    
    # Save training data for SHAP
    joblib.dump(X_train, 'x_train.pkl')
    
    # Save metrics as JSON
    print("\n5. Saving model metrics...")
    with open('model_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("   Metrics saved: model_metrics.json")
    
    # Display summary
    print("\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)
    
    for model_id, m in metrics.items():
        print(f"\n{m['name']}:")
        print(f"  R2 Score: {m['r2_score']:.4f}")
        print(f"  MAE:      {m['mae']:.4f}")
        print(f"  RMSE:     {m['rmse']:.4f}")
    
    # Recommend best model
    best_model = max(metrics.items(), key=lambda x: x[1]['r2_score'])
    print(f"\nBest Model: {best_model[1]['name']} (R2 = {best_model[1]['r2_score']:.4f})")
    
    print("\nAll models trained successfully!")
    print("="*60)
    
    return metrics

if __name__ == '__main__':
    metrics = train_all_models('student-mat.csv')
