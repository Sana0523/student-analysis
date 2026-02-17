import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModelSelector from '@/app/components/ModelSelector';

// Mock fetch
global.fetch = jest.fn();

const mockMetrics = {
  linear_regression: {
    name: 'Linear Regression',
    description: 'Fast, interpretable baseline',
    r2_score: 0.8456,
    mae: 0.0521,
    rmse: 0.0687,
    train_r2: 0.8621
  },
  random_forest: {
    name: 'Random Forest',
    description: 'Handles non-linear patterns',
    r2_score: 0.9123,
    mae: 0.0312,
    rmse: 0.0431,
    train_r2: 0.9456
  },
  xgboost: {
    name: 'XGBoost',
    description: 'Highest accuracy',
    r2_score: 0.9287,
    mae: 0.0289,
    rmse: 0.0398,
    train_r2: 0.9512
  }
};

describe('ModelSelector', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all model options', async () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('Linear Regression')).toBeInTheDocument();
      expect(screen.getByText('Random Forest')).toBeInTheDocument();
      expect(screen.getByText('XGBoost')).toBeInTheDocument();
    });
  });

  it('fetches metrics on mount', async () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ml/model-metrics');
    });
  });

  it('displays R² scores when metrics loaded', async () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText(/0.846/)).toBeInTheDocument();
    });
  });

  it('calls onModelChange when model is clicked', async () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('Random Forest')).toBeInTheDocument();
    });

    const randomForestCard = screen.getByText('Random Forest').closest('div[class*="cursor-pointer"]');
    if (randomForestCard) {
      fireEvent.click(randomForestCard);
    }
    
    expect(mockOnChange).toHaveBeenCalledWith('random_forest');
  });

  it('highlights selected model', async () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="random_forest" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('✓ Active')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    expect(screen.getByText('Model Selection')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="linear_regression" onModelChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Unable to load model metrics/i)).toBeInTheDocument();
    });
  });
});
