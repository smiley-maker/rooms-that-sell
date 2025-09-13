import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ImageDisplay } from './ImageDisplay';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { Id } from '../../convex/_generated/dataModel';

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

// Mock the action
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useAction: vi.fn(() => vi.fn().mockResolvedValue('https://example.com/image.jpg')),
  };
});

describe('ImageDisplay', () => {
  const mockImageId = 'test-image-id' as Id<"images">;

  const renderImageDisplay = (props = {}) => {
    return render(
      <ConvexProvider client={mockConvex}>
        <ImageDisplay
          imageId={mockImageId}
          className="w-32 h-32"
          alt="Test image"
          {...props}
        />
      </ConvexProvider>
    );
  };

  it('renders loading state initially', () => {
    renderImageDisplay();
    
    // Should show loading spinner (Loader2 icon)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles different image states', () => {
    renderImageDisplay({ isStaged: true });
    
    // Component should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderImageDisplay();
    
    // Should have the custom class applied
    const loadingDiv = container.querySelector('.w-32.h-32');
    expect(loadingDiv).toBeInTheDocument();
  });
});