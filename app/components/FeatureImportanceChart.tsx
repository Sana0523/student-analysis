'use client';

interface Factor {
  factor: string;
  value: number;
  impact: 'positive' | 'negative';
  contribution_percentage: string;
  shap_value: number;
  description?: string;
}

interface FeatureImportanceChartProps {
  factors: Factor[];
  title?: string;
}

export default function FeatureImportanceChart({ 
  factors, 
  title = "What's Driving This Prediction?" 
}: FeatureImportanceChartProps) {
  
  if (!factors || factors.length === 0) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
        <h3 className="text-md font-semibold mb-4 text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">No explanation data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
      <h3 className="text-md font-semibold mb-4 text-gray-800">{title}</h3>
      
      <div className="space-y-3">
        {factors.map((factor, index) => {
          const impactValue = parseFloat(factor.contribution_percentage.replace('%', '').replace('+', ''));
          const isPositive = factor.impact === 'positive';
          const barWidth = Math.min(Math.abs(impactValue), 100);
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {factor.factor}
                </span>
                <span className={`text-sm font-bold ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {factor.contribution_percentage}
                </span>
              </div>
              
              {/* Horizontal bar */}
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive 
                      ? 'bg-gradient-to-r from-green-400 to-green-600' 
                      : 'bg-gradient-to-r from-red-400 to-red-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
                
                {/* Value label inside bar */}
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs font-medium text-white drop-shadow">
                    {factor.value}
                  </span>
                </div>
              </div>
              
              {/* Description on hover */}
              {factor.description && (
                <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {factor.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Interpretation Guide */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="text-green-600 font-semibold">Green bars</span> show factors improving the grade. 
          <span className="text-red-600 font-semibold ml-1">Red bars</span> show areas for improvement.
        </p>
      </div>
    </div>
  );
}
