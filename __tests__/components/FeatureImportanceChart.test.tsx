import { render, screen } from '@testing-library/react';
import FeatureImportanceChart from '@/app/components/FeatureImportanceChart';

const mockFactors = [
  {
    factor: 'Studytime',
    value: 3,
    impact: 'positive' as const,
    contribution_percentage: '+12.5%',
    shap_value: 2.1,
    description: 'Study time level 3/4'
  },
  {
    factor: 'Absences',
    value: 15,
    impact: 'negative' as const,
    contribution_percentage: '-8.3%',
    shap_value: -1.8,
    description: '15 absences (high)'
  },
  {
    factor: 'G2',
    value: 14,
    impact: 'positive' as const,
    contribution_percentage: '+7.1%',
    shap_value: 1.5,
    description: 'Period 2 grade: 14/20'
  }
];

describe('FeatureImportanceChart', () => {
  
  it('renders all factors', () => {
    render(<FeatureImportanceChart factors={mockFactors} />);
    
    expect(screen.getByText('Studytime')).toBeInTheDocument();
    expect(screen.getByText('Absences')).toBeInTheDocument();
    expect(screen.getByText('G2')).toBeInTheDocument();
  });
  
  it('displays positive percentages correctly', () => {
    render(<FeatureImportanceChart factors={mockFactors} />);
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('+7.1%')).toBeInTheDocument();
  });
  
  it('displays negative percentages correctly', () => {
    render(<FeatureImportanceChart factors={mockFactors} />);
    
    expect(screen.getByText('-8.3%')).toBeInTheDocument();
  });
  
  it('renders custom title when provided', () => {
    render(<FeatureImportanceChart factors={mockFactors} title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  it('renders default title when not provided', () => {
    render(<FeatureImportanceChart factors={mockFactors} />);
    
    expect(screen.getByText("What's Driving This Prediction?")).toBeInTheDocument();
  });
  
  it('shows interpretation guide', () => {
    render(<FeatureImportanceChart factors={mockFactors} />);
    
    expect(screen.getByText(/Green bars/i)).toBeInTheDocument();
    expect(screen.getByText(/Red bars/i)).toBeInTheDocument();
  });
  
  it('handles empty factors array', () => {
    render(<FeatureImportanceChart factors={[]} />);
    
    expect(screen.getByText('No explanation data available')).toBeInTheDocument();
  });
});
