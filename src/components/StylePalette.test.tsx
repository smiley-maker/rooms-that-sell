import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StylePalette, STYLE_PRESETS } from './StylePalette';

describe('StylePalette', () => {
  const mockOnStyleSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all style preset options', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
      />
    );

    // Check that all style presets are rendered
    STYLE_PRESETS.forEach(preset => {
      expect(screen.getByText(preset.name)).toBeInTheDocument();
      expect(screen.getByText(preset.description)).toBeInTheDocument();
    });
  });

  it('shows selected style with visual indicator', () => {
    render(
      <StylePalette 
        selectedStyle="minimal"
        onStyleSelect={mockOnStyleSelect}
      />
    );

    // The selected style should have a check mark and ring styling
    const minimalCard = screen.getByText('Minimal').closest('[data-slot="card"]');
    
    expect(minimalCard).toHaveClass('ring-2', 'ring-primary');
  });

  it('calls onStyleSelect when a style is clicked', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
      />
    );

    const scandinavianCard = screen.getByText('Scandinavian').closest('[data-slot="card"]');
    
    if (scandinavianCard) {
      fireEvent.click(scandinavianCard);
    }

    expect(mockOnStyleSelect).toHaveBeenCalledWith('scandinavian');
  });

  it('renders in compact mode when specified', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={true}
      />
    );

    // In compact mode, descriptions should not be visible
    STYLE_PRESETS.forEach(preset => {
      expect(screen.getByText(preset.name)).toBeInTheDocument();
      expect(screen.queryByText(preset.description)).not.toBeInTheDocument();
    });
  });

  it('displays style keywords as badges in full mode', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={false}
      />
    );

    // Check that keywords are displayed as badges
    const minimalPreset = STYLE_PRESETS.find(p => p.id === 'minimal');
    if (minimalPreset) {
      // Should show first 3 keywords
      minimalPreset.keywords.slice(0, 3).forEach(keyword => {
        expect(screen.getByText(keyword)).toBeInTheDocument();
      });
    }
  });

  it('shows +N indicator when there are more than 3 keywords', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={false}
      />
    );

    // Find a preset with more than 3 keywords
    const presetWithManyKeywords = STYLE_PRESETS.find(p => p.keywords.length > 3);
    if (presetWithManyKeywords) {
      const extraCount = presetWithManyKeywords.keywords.length - 3;
      const indicators = screen.getAllByText(`+${extraCount}`);
      expect(indicators.length).toBeGreaterThan(0);
    }
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows title and description in full mode', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={false}
      />
    );

    expect(screen.getByText('Choose Style Palette')).toBeInTheDocument();
    expect(screen.getByText(/Select a style that will be consistently applied/)).toBeInTheDocument();
  });

  it('hides title and description in compact mode', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={true}
      />
    );

    expect(screen.queryByText('Choose Style Palette')).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a style that will be consistently applied/)).not.toBeInTheDocument();
  });

  it('uses different grid layouts for compact and full modes', () => {
    const { rerender } = render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={false}
      />
    );

    let gridContainer = screen.getByText('Minimal').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');

    rerender(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
        compact={true}
      />
    );

    gridContainer = screen.getByText('Minimal').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-2', 'lg:grid-cols-5');
  });

  it('displays preview emoji for each style', () => {
    render(
      <StylePalette 
        onStyleSelect={mockOnStyleSelect}
      />
    );

    STYLE_PRESETS.forEach(preset => {
      if (preset.preview) {
        expect(screen.getByText(preset.preview)).toBeInTheDocument();
      }
    });
  });
});