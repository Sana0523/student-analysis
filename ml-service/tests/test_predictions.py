"""
Unit tests for prediction functionality
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Change working directory to ml-service so .pkl files are found
os.chdir(os.path.dirname(os.path.abspath(os.path.join(__file__, '..'))))

import pytest
import numpy as np
import joblib


# Mock prediction function using the actual model files
def predict_grade_mock(student_data):
    """
    Mock prediction function that mirrors the actual predict() logic
    Uses the real model files for integration-level testing
    Feature order: age, failures, absences, studytime, G1, G2
    """
    model = joblib.load('linear_regression_model.pkl')
    grade_scaler = joblib.load('grade_scaler.pkl')

    input_array = np.array([[
        student_data['age'],
        student_data['failures'],
        student_data['absences'],
        student_data['studytime'],
        student_data['G1'],
        student_data['G2']
    ]])

    scaled_pred = model.predict(input_array)
    original_pred = grade_scaler.inverse_transform(scaled_pred.reshape(-1, 1))
    final_grade = max(0, min(20, original_pred[0][0]))
    predicted_grade = (final_grade / 20) * 100

    risk_level = "High" if final_grade < 10 else "Medium" if final_grade < 14 else "Low"

    return {
        'success': True,
        'predicted_grade': f"{predicted_grade:.2f}",
        'risk_level': risk_level
    }


class TestPredictions:
    """Test suite for prediction functionality"""

    def test_high_performer_gets_low_risk(self):
        """Student with high grades and low absences should be Low risk"""
        data = {
            'age': 16,
            'studytime': 4,
            'failures': 0,
            'absences': 2,
            'G1': 18,
            'G2': 19
        }
        result = predict_grade_mock(data)

        assert result['success'] == True
        assert result['risk_level'] == 'Low'
        assert float(result['predicted_grade']) > 75

    def test_at_risk_student_gets_high_risk(self):
        """Student with low grades and high absences should be High risk"""
        data = {
            'age': 17,
            'studytime': 1,
            'failures': 3,
            'absences': 25,
            'G1': 6,
            'G2': 7
        }
        result = predict_grade_mock(data)

        assert result['success'] == True
        assert result['risk_level'] == 'High'
        assert float(result['predicted_grade']) < 50

    def test_predicted_grade_within_bounds(self):
        """Predicted grade must be between 0 and 100"""
        # Test extreme high values
        extreme_high = {
            'age': 15,
            'studytime': 4,
            'failures': 0,
            'absences': 0,
            'G1': 20,
            'G2': 20
        }
        result = predict_grade_mock(extreme_high)
        grade = float(result['predicted_grade'])
        assert 0 <= grade <= 100, f"Grade {grade} out of bounds"

        # Test extreme low values
        extreme_low = {
            'age': 20,
            'studytime': 1,
            'failures': 5,
            'absences': 50,
            'G1': 0,
            'G2': 0
        }
        result = predict_grade_mock(extreme_low)
        grade = float(result['predicted_grade'])
        assert 0 <= grade <= 100, f"Grade {grade} out of bounds"

    def test_studytime_impact(self):
        """Increasing study time should improve or not worsen prediction"""
        base_data = {
            'age': 16,
            'studytime': 1,
            'failures': 0,
            'absences': 5,
            'G1': 12,
            'G2': 12
        }

        improved_data = base_data.copy()
        improved_data['studytime'] = 4

        base_result = predict_grade_mock(base_data)
        improved_result = predict_grade_mock(improved_data)

        # Study time should generally help (or at least not hurt significantly)
        assert float(improved_result['predicted_grade']) >= float(base_result['predicted_grade']) - 5

    def test_absences_impact(self):
        """Reducing absences should improve or maintain prediction"""
        high_absence = {
            'age': 16,
            'studytime': 3,
            'failures': 0,
            'absences': 20,
            'G1': 12,
            'G2': 12
        }

        low_absence = high_absence.copy()
        low_absence['absences'] = 2

        high_result = predict_grade_mock(high_absence)
        low_result = predict_grade_mock(low_absence)

        # Lower absences should generally help
        assert float(low_result['predicted_grade']) >= float(high_result['predicted_grade']) - 5

    def test_g2_strongly_predicts_final(self):
        """G2 (period 2 grade) should be a strong predictor"""
        low_g2 = {
            'age': 16,
            'studytime': 2,
            'failures': 0,
            'absences': 5,
            'G1': 10,
            'G2': 5
        }

        high_g2 = low_g2.copy()
        high_g2['G2'] = 18

        low_result = predict_grade_mock(low_g2)
        high_result = predict_grade_mock(high_g2)

        assert float(high_result['predicted_grade']) > float(low_result['predicted_grade'])


class TestModelMetrics:
    """Test model performance metrics"""

    def test_all_models_exist(self):
        """All 3 model files should exist"""
        models = ['linear_regression', 'random_forest', 'xgboost']
        for model in models:
            filename = f'{model}_model.pkl'
            assert os.path.exists(filename), f"Model file missing: {filename}"

    def test_model_metrics_file_exists(self):
        """model_metrics.json should exist"""
        assert os.path.exists('model_metrics.json'), "Metrics file missing"

    def test_metrics_structure(self):
        """Metrics file should have correct structure"""
        import json

        with open('model_metrics.json', 'r') as f:
            metrics = json.load(f)

        required_models = ['linear_regression', 'random_forest', 'xgboost']
        for model in required_models:
            assert model in metrics, f"Model {model} missing from metrics"
            assert 'r2_score' in metrics[model]
            assert 'mae' in metrics[model]
            assert 'rmse' in metrics[model]

    def test_r2_scores_reasonable(self):
        """All models should have R² > 0.5"""
        import json

        with open('model_metrics.json', 'r') as f:
            metrics = json.load(f)

        for model, m in metrics.items():
            assert m['r2_score'] > 0.5, f"{model} has poor R² score: {m['r2_score']}"
            assert m['r2_score'] <= 1.0, f"{model} has invalid R² score: {m['r2_score']}"


class TestPDFGeneration:
    """Test PDF report generation"""

    def test_generate_report_creates_pdf(self):
        """Report generation should create valid PDF buffer"""
        from generate_report import generate_student_report

        sample_student = {
            'id': 1,
            'name': 'Test Student',
            'email': 'test@example.com',
            'age': 16,
            'studytime': 2,
            'failures': 0,
            'absences': 5
        }

        sample_grades = [
            {'subject': 'Math', 'score': 15, 'max_marks': 20, 'grade': 'B+'}
        ]

        sample_prediction = {
            'predicted_grade': '75.0',
            'risk_level': 'Medium',
            'explanation': {'summary': 'Test', 'top_factors': []}
        }

        pdf_buffer = generate_student_report(sample_student, sample_grades, sample_prediction)

        assert pdf_buffer is not None

        # Check PDF signature (buffer is seeked to 0 by generate_student_report)
        header = pdf_buffer.read(4)
        assert header == b'%PDF', "Invalid PDF signature"

        # Check buffer has substantial content
        pdf_buffer.seek(0, 2)  # Seek to end
        assert pdf_buffer.tell() > 100, "PDF buffer too small"


class TestScalerAndFeatures:
    """Test scaler and feature pipeline"""

    def test_grade_scaler_exists(self):
        """Grade scaler file should exist"""
        assert os.path.exists('grade_scaler.pkl'), "grade_scaler.pkl missing"

    def test_x_train_exists(self):
        """X_train file should exist for SHAP"""
        assert os.path.exists('x_train.pkl'), "x_train.pkl missing"

    def test_x_train_has_correct_features(self):
        """X_train should have 6 features"""
        X_train = joblib.load('x_train.pkl')
        assert X_train.shape[1] == 6, f"Expected 6 features, got {X_train.shape[1]}"

    def test_grade_scaler_inverse_transform(self):
        """Grade scaler should correctly inverse transform"""
        scaler = joblib.load('grade_scaler.pkl')
        # Test with a known scaled value
        test_val = np.array([[0.5]])
        result = scaler.inverse_transform(test_val)
        # Result should be a reasonable grade (0-20 range)
        assert 0 <= result[0][0] <= 20, f"Inverse transform out of range: {result[0][0]}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
