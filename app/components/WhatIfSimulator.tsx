'use client';

import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface WhatIfSimulatorProps {
  studentData: {
    id: number;
    name: string;
    age: number;
    studytime: number;
    failures: number;
    absences: number;
    G1: number;
    G2: number;
  };
  currentPrediction: number;
  selectedModel: string;
}

export default function WhatIfSimulator({ 
  studentData, 
  currentPrediction, 
  selectedModel 
}: WhatIfSimulatorProps) {
  const [counselingMode, setCounselingMode] = useState(false);
  const [simulatedStudytime, setSimulatedStudytime] = useState(studentData.studytime);
  const [simulatedAbsences, setSimulatedAbsences] = useState(studentData.absences);
  const [simulatedPrediction, setSimulatedPrediction] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [improvement, setImprovement] = useState(0);

  // Reset sliders when student changes
  useEffect(() => {
    setSimulatedStudytime(studentData.studytime);
    setSimulatedAbsences(studentData.absences);
    setSimulatedPrediction(null);
  }, [studentData.id, studentData.studytime, studentData.absences]);

  // Debounced simulation fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSimulation = useCallback(
    debounce(async (studytime: number, absences: number) => {
      setIsSimulating(true);
      try {
        const response = await fetch('/api/predictions/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_data: {
              age: studentData.age,
              studytime: studytime,
              failures: studentData.failures,
              absences: absences,
              G1: studentData.G1,
              G2: studentData.G2
            },
            max_marks: 100,
            model: selectedModel
          })
        });

        const data = await response.json();
        
        if (data.success) {
          const predicted = parseFloat(data.predicted_grade);
          setSimulatedPrediction(predicted);
          setImprovement(predicted - currentPrediction);
        }
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        setIsSimulating(false);
      }
    }, 500),
    [studentData, currentPrediction, selectedModel]
  );

  // Trigger simulation when sliders change
  useEffect(() => {
    if (counselingMode) {
      fetchSimulation(simulatedStudytime, simulatedAbsences);
    }
  }, [simulatedStudytime, simulatedAbsences, counselingMode, fetchSimulation]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-md border-2 border-purple-200">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-purple-900">
            🎯 What-If Counseling Simulator
          </h3>
          <p className="text-sm text-gray-600">
            Explore how behavior changes affect predicted grades
          </p>
        </div>
        
        <button
          onClick={() => setCounselingMode(!counselingMode)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            counselingMode ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            counselingMode ? 'translate-x-8' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Simulator Panel (only visible when active) */}
      {counselingMode && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-5 border-2 border-purple-300">
          
          {/* Study Time Slider */}
          <div className="mb-6">
            <label className="flex justify-between text-sm font-medium mb-2">
              <span>Weekly Study Time</span>
              <span className="text-blue-600 font-bold">{simulatedStudytime}/4</span>
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={simulatedStudytime}
              onChange={(e) => setSimulatedStudytime(parseInt(e.target.value))}
              className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 (Minimal)</span>
              <span className={simulatedStudytime > studentData.studytime ? 'text-green-600 font-medium' : 
                             simulatedStudytime < studentData.studytime ? 'text-red-600 font-medium' : ''}>
                {simulatedStudytime > studentData.studytime && `+${simulatedStudytime - studentData.studytime} increase`}
                {simulatedStudytime < studentData.studytime && `${simulatedStudytime - studentData.studytime} decrease`}
                {simulatedStudytime === studentData.studytime && 'Current level'}
              </span>
              <span>4 (Intensive)</span>
            </div>
          </div>

          {/* Absences Slider */}
          <div className="mb-6">
            <label className="flex justify-between text-sm font-medium mb-2">
              <span>Monthly Absences</span>
              <span className="text-red-600 font-bold">{simulatedAbsences}</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={simulatedAbsences}
              onChange={(e) => setSimulatedAbsences(parseInt(e.target.value))}
              className="w-full h-3 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Perfect)</span>
              <span className={simulatedAbsences < studentData.absences ? 'text-green-600 font-medium' : 
                             simulatedAbsences > studentData.absences ? 'text-red-600 font-medium' : ''}>
                {simulatedAbsences < studentData.absences && `-${studentData.absences - simulatedAbsences} fewer`}
                {simulatedAbsences > studentData.absences && `+${simulatedAbsences - studentData.absences} more`}
                {simulatedAbsences === studentData.absences && 'Current level'}
              </span>
              <span>30 (Critical)</span>
            </div>
          </div>

          {/* Prediction Comparison */}
          <div className="bg-white rounded-lg p-5 border-2 border-purple-400 relative">
            {isSimulating && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg z-10">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Recalculating...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 items-center">
              {/* Current Grade */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="text-2xl font-bold text-gray-700">
                  {currentPrediction.toFixed(1)}%
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>

              {/* Simulated Grade */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Simulated</p>
                <p className={`text-2xl font-bold ${
                  simulatedPrediction && simulatedPrediction > currentPrediction ? 'text-green-600' :
                  simulatedPrediction && simulatedPrediction < currentPrediction ? 'text-red-600' :
                  'text-gray-700'
                }`}>
                  {simulatedPrediction ? `${simulatedPrediction.toFixed(1)}%` : '—'}
                </p>
              </div>
            </div>

            {/* Improvement Badge */}
            {simulatedPrediction !== null && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                  improvement > 0 ? 'bg-green-50 border border-green-200' :
                  improvement < 0 ? 'bg-red-50 border border-red-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {improvement > 0 ? (
                    <>
                      <span className="text-2xl">📈</span>
                      <span className="text-green-700 font-semibold">
                        +{improvement.toFixed(1)}% improvement
                      </span>
                    </>
                  ) : improvement < 0 ? (
                    <>
                      <span className="text-2xl">📉</span>
                      <span className="text-red-700 font-semibold">
                        {improvement.toFixed(1)}% decline
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600">No change</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actionable Insight */}
          {simulatedPrediction && improvement > 5 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>💡 Counseling Insight:</strong> If {studentData.name} can 
                {simulatedStudytime > studentData.studytime && ` increase study time to level ${simulatedStudytime}`}
                {simulatedStudytime > studentData.studytime && simulatedAbsences < studentData.absences && ' and'}
                {simulatedAbsences < studentData.absences && ` reduce absences to ${simulatedAbsences}/month`}, 
                their predicted grade could improve by <strong>{improvement.toFixed(1)}%</strong>.
              </p>
            </div>
          )}

          {simulatedPrediction && improvement < -5 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> These changes would likely decrease the grade by {Math.abs(improvement).toFixed(1)}%. 
                Consider maintaining current habits or improving further.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
