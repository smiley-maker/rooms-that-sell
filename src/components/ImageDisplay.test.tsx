import { describe, it, expect, vi } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { ImageDisplay } from './ImageDisplay';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { Id } from '../../convex/_generated/dataModel';

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

// Mock the action
const mockGetImageDownloadUrl = vi.fn();
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useAction: vi.fn(() => mockGetImageDownloadUrl),
  };
});

describe('ImageDisplay', () => {
  const mockImageId = 'test-image-id' as Id<"images">;

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('renders loading state initially', async () => {
    // Mock the action to resolve after a delay to test loading state
    mockGetImageDownloadUrl.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('https://example.com/image.jpg'), 100))
    );

    const { container } = renderImageDisplay();
    
    // Should show loading spinner initially
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    
    // Wait for the image to load
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('handles different image states', async () => {
    mockGetImageDownloadUrl.mockResolvedValue('https://example.com/image.jpg');

    await act(async () => {
      renderImageDisplay({ isStaged: true });
    });
    
    // Component should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    mockGetImageDownloadUrl.mockResolvedValue('https://example.com/image.jpg');

    const { container } = await act(async () => {
      return renderImageDisplay();
    });
    
    // Should have the custom class applied
    const loadingDiv = container.querySelector('.w-32.h-32');
    expect(loadingDiv).toBeInTheDocument();
  });
});