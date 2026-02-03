/**
 * PredictionCard Component
 * ========================
 * Displays a prediction result with visual indicator for risk level.
 */

'use client';

interface Prediction {
  id?: string;
  studentId: string;
  predictedGrade: number;
  confidence?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  createdAt?: string;
  factors?: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    value: number;
  }[];
}

interface PredictionCardProps {
  prediction: Prediction;
  studentName?: string;
  maxGrade?: number;
  onSave?: (prediction: Prediction) => void;
  showSaveButton?: boolean;
}

export default function PredictionCard({
  prediction,
  studentName,
  maxGrade = 20,
  onSave,
  showSaveButton = false
}: PredictionCardProps) {
  const percentage = (prediction.predictedGrade / maxGrade) * 100;
  
  // Determine risk level based on predicted grade if not provided
  const riskLevel = prediction.riskLevel || (
    percentage >= 70 ? 'low' :
    percentage >= 50 ? 'medium' : 'high'
  );
  
  const riskColors = {
    low: { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-400' },
    medium: { bg: 'bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-400' },
    high: { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-400' }
  };
  
  const colors = riskColors[riskLevel];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
      {studentName && (
        <h3 className="text-xl font-bold mb-4">{studentName}</h3>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm">Predicted Grade</p>
          <p className="text-4xl font-bold">{prediction.predictedGrade.toFixed(1)}<span className="text-lg text-gray-400">/{maxGrade}</span></p>
        </div>
        
        <div className="text-right">
          <p className="text-gray-400 text-sm">Performance Level</p>
          <span className={`${colors.text} text-lg font-semibold capitalize`}>
            {riskLevel === 'low' ? 'Good' : riskLevel === 'medium' ? 'At Risk' : 'Critical'}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              riskLevel === 'low' ? 'bg-green-500' :
              riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-400 mt-1">{percentage.toFixed(1)}%</p>
      </div>
      
      {/* Confidence */}
      {prediction.confidence !== undefined && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Confidence Level</p>
          <p className="text-lg">{(prediction.confidence * 100).toFixed(0)}%</p>
        </div>
      )}
      
      {/* Contributing Factors */}
      {prediction.factors && prediction.factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Contributing Factors</p>
          <div className="space-y-2">
            {prediction.factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{factor.name}</span>
                <span className={`text-sm ${
                  factor.impact === 'positive' ? 'text-green-400' :
                  factor.impact === 'negative' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {factor.impact === 'positive' ? '↑' : factor.impact === 'negative' ? '↓' : '→'}
                  {' '}{factor.value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Timestamp */}
      {prediction.createdAt && (
        <p className="text-gray-500 text-xs mt-4">
          Generated: {new Date(prediction.createdAt).toLocaleString()}
        </p>
      )}
      
      {/* Save Button */}
      {showSaveButton && onSave && (
        <button
          onClick={() => onSave(prediction)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
        >
          Save Prediction
        </button>
      )}
    </div>
  );
}
