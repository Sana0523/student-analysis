'use client';

import { useState, useEffect } from 'react';
import ModelSelector from '@/app/components/ModelSelector';
import FeatureImportanceChart from '@/app/components/FeatureImportanceChart';
import WhatIfSimulator from '@/app/components/WhatIfSimulator';
import AttendanceTrendChart from '@/app/components/AttendanceTrendChart';

// Mock data for testing
const mockStudent = {
  id: 1,
  name: 'John Doe',
  age: 16,
  studytime: 2,
  failures: 1,
  absences: 10,
  G1: 11,
  G2: 12
};

const mockFactors = [
  {
    factor: 'G2',
    value: 12,
    shap_value: 4.2,
    impact: 'positive' as const,
    contribution_percentage: '+8.5%',
    description: 'Period 2 grade: 12/20'
  },
  {
    factor: 'Absences',
    value: 10,
    shap_value: -3.1,
    impact: 'negative' as const,
    contribution_percentage: '-6.2%',
    description: '10 absences (acceptable)'
  },
  {
    factor: 'G1',
    value: 11,
    shap_value: 3.8,
    impact: 'positive' as const,
    contribution_percentage: '+7.6%',
    description: 'Period 1 grade: 11/20'
  },
  {
    factor: 'Study Time',
    value: 2,
    shap_value: -1.5,
    impact: 'negative' as const,
    contribution_percentage: '-3.0%',
    description: 'Study time level 2/4'
  },
  {
    factor: 'Past Failures',
    value: 1,
    shap_value: -2.0,
    impact: 'negative' as const,
    contribution_percentage: '-4.0%',
    description: '1 previous failure'
  }
];

export default function TestComponentsPage() {
  const [selectedModel, setSelectedModel] = useState('linear_regression');
  const [attendanceData, setAttendanceData] = useState<{ weeks: string[]; attendance_rate: number[]; predicted_grades: number[] } | null>(null);

  useEffect(() => {
    fetch('/api/analytics/attendance-trend/1')
      .then(res => res.json())
      .then(data => setAttendanceData(data))
      .catch(err => console.error('Failed to fetch attendance data:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Component Testing Page</h1>
        <p className="text-gray-600">Testing all Prompt 3 components independently before dashboard integration.</p>
        
        {/* Model Selector */}
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Model Selector Component</h2>
          <ModelSelector 
            selectedModel={selectedModel}
            onModelChange={(model) => {
              console.log('Model changed to:', model);
              setSelectedModel(model);
            }}
          />
        </section>

        {/* Feature Importance Chart */}
        <section>
          <h2 className="text-xl font-semibold mb-4">2. Feature Importance Chart (Mock Data)</h2>
          <FeatureImportanceChart factors={mockFactors} />
        </section>

        {/* What-If Simulator */}
        <section>
          <h2 className="text-xl font-semibold mb-4">3. What-If Simulator</h2>
          <WhatIfSimulator 
            studentData={mockStudent}
            currentPrediction={65.5}
            selectedModel={selectedModel}
          />
        </section>

        {/* Selected Model Indicator */}
        <section className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Currently selected model:</strong>{' '}
            <span className="text-blue-600 font-mono">{selectedModel}</span>
          </p>
        </section>

        {/* Attendance Trend Chart */}
        {attendanceData && (
          <section>
            <h2 className="text-xl font-semibold mb-4">4. Attendance Trend Chart</h2>
            <AttendanceTrendChart 
              studentName="John Doe"
              data={attendanceData}
            />
          </section>
        )}
      </div>
    </div>
  );
}
