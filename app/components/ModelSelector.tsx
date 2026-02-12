'use client';

import { useEffect, useState } from 'react';

interface ModelMetrics {
  name: string;
  description: string;
  r2_score: number;
  mae: number;
  rmse: number;
  train_r2: number;
}

interface ModelSelectorProps {
  onModelChange: (modelName: string) => void;
  selectedModel: string;
}

const MODEL_OPTIONS = [
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'Fast, interpretable baseline model',
    icon: '📈'
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'Handles non-linear patterns accurately',
    icon: '🌲'
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    description: 'Highest accuracy, complex patterns',
    icon: '⚡'
  }
];

export default function ModelSelector({ onModelChange, selectedModel }: ModelSelectorProps) {
  const [metrics, setMetrics] = useState<Record<string, ModelMetrics> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/ml/model-metrics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch model metrics');
        }
        
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Unable to load model metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">Model Selection</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Model Selection</h3>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4">🤖 Model Selection</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose the machine learning model for predictions
      </p>
      
      <div className="space-y-3">
        {MODEL_OPTIONS.map(model => (
          <div 
            key={model.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedModel === model.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
            onClick={() => onModelChange(model.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{model.icon}</span>
                <div>
                  <span className="font-medium text-gray-900">{model.name}</span>
                  {metrics && (
                    <span className="ml-2 text-xs text-gray-500">
                      R² = {metrics[model.id]?.r2_score.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
              {selectedModel === model.id && (
                <span className="text-blue-600 text-sm font-semibold">✓ Active</span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{model.description}</p>
            
            {metrics && selectedModel === model.id && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-gray-500">R² Score</div>
                  <div className="font-semibold text-blue-600">
                    {metrics[model.id]?.r2_score.toFixed(3)}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-gray-500">MAE</div>
                  <div className="font-semibold text-green-600">
                    {metrics[model.id]?.mae.toFixed(3)}
                  </div>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <div className="text-gray-500">RMSE</div>
                  <div className="font-semibold text-purple-600">
                    {metrics[model.id]?.rmse.toFixed(3)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Higher R² score means better accuracy. 
          Lower MAE/RMSE means smaller prediction errors.
        </p>
      </div>
    </div>
  );
}
