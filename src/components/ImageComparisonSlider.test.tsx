import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ImageComparisonSlider } from './ImageComparisonSlider';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Convex
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useAction: vi.fn(),
    ConvexProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock ImageDisplay component
vi.mock('./ImageDisplay', () => ({
  ImageDisplay: ({ imageId, isStaged, alt }: { imageId: string; isStaged: boolean; alt: string }) => (
    <div data-testid={`image-display-${imageId}-${isStaged ? 'staged' : 'original'}`}>
      {alt}
    </div>
  ),
}));

describe('ImageComparisonSlider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      imageId: 'img1' as any,
      originalUrl: 'https://example.com/original.jpg',
      stagedUrl: 'https://example.com/staged.jpg',
      className: 'test-class',
    };

    const { ConvexProvider } = require('convex/react');
    
    return render(
      <ConvexProvider>
        <ImageComparisonSlider {...defaultProps} {...props} />
      </ConvexProvider>
    );
  };

  it('renders both original and staged images when stagedUrl is provided', () => {
    renderComponent();
    
    expect(screen.getByTestId('image-display-img1-original')).toBeInTheDocument();
    expect(screen.getByTestId('image-display-img1-staged')).toBeInTheDocument();
    expect(screen.getByText('Drag to compare')).toBeInTheDocument();
  });

  it('renders only original image when no stagedUrl is provided', () => {
    renderComponent({ stagedUrl: null });
    
    expect(screen.getByTestId('image-display-img1-original')).toBeInTheDocument();
    expect(screen.queryByTestId('image-display-img1-staged')).not.toBeInTheDocument();
    expect(screen.getByText('Original Only')).toBeInTheDocument();
    expect(screen.getByText('No staged version available')).toBeInTheDocument();
  });

  it('shows original and staged labels', () => {
    renderComponent();
    
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Staged')).toBeInTheDocument();
  });

  it('has draggable slider handle', () => {
    renderComponent();
    
    // Find the slider handle by looking for the Move icon (which is inside the slider handle)
    const sliderHandle = screen.getByRole('img', { hidden: true }); // The Move icon
    expect(sliderHandle).toBeInTheDocument();
    expect(sliderHandle.closest('.cursor-ew-resize')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderComponent({ className: 'custom-class' });
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles mouse events for slider interaction', () => {
    const { container } = renderComponent();
    
    const sliderContainer = container.firstChild as HTMLElement;
    
    // Simulate mouse down
    fireEvent.mouseDown(sliderContainer, { clientX: 100 });
    
    // Simulate mouse move
    fireEvent.mouseMove(sliderContainer, { clientX: 150 });
    
    // Simulate mouse up
    fireEvent.mouseUp(sliderContainer);
    
    // The component should handle these events without errors
    expect(sliderContainer).toBeInTheDocument();
  });

  it('handles touch events for mobile interaction', () => {
    const { container } = renderComponent();
    
    const sliderContainer = container.firstChild as HTMLElement;
    
    // Simulate touch start
    fireEvent.touchStart(sliderContainer, {
      touches: [{ clientX: 100 }]
    });
    
    // Simulate touch move
    fireEvent.touchMove(sliderContainer, {
      touches: [{ clientX: 150 }]
    });
    
    // Simulate touch end
    fireEvent.touchEnd(sliderContainer);
    
    // The component should handle these events without errors
    expect(sliderContainer).toBeInTheDocument();
  });
});