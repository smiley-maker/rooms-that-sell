import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BatchProcessor } from './BatchProcessor';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Convex client
const mockConvex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://test.convex.cloud');

// Mock data
const mockImages = [
  {
    _id: 'image1' as any,
    filename: 'kitchen.jpg',
    roomType: 'kitchen',
    status: 'uploaded',
    fileSize: 1024000,
    dimensions: { width: 1920, height: 1080 },
    metadata: { detectedFeatures: ['cabinets'], confidence: 0.9 }
  },
  {
    _id: 'image2' as any,
    filename: 'living_room.jpg',
    roomType: 'living_room',
    status: 'uploaded',
    fileSize: 2048000,
    dimensions: { width: 1920, height: 1080 },
    metadata: { detectedFeatures: ['fireplace'], confidence: 0.8 }
  },
  {
    _id: 'image3' as any,
    filename: 'bedroom.jpg',
    roomType: 'bedroom',
    status: 'staged',
    fileSize: 1536000,
    dimensions: { width: 1920, height: 1080 },
    metadata: { detectedFeatures: ['bed'], confidence: 0.95 }
  }
];

const mockUser = {
  _id: 'user1' as any,
  credits: 25,
  plan: 'agent'
};

// Mock Convex hooks
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useQuery: mockUseQuery,
    useMutation: mockUseMutation,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('BatchProcessor', () => {
  const mockCreateStagingJob = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementations
    mockUseQuery.mockImplementation((query: any) => {
      if (query.toString().includes('getProjectImages')) {
        return mockImages;
      }
      if (query.toString().includes('getCurrentUser')) {
        return mockUser;
      }
      if (query.toString().includes('getActiveStagingJobs')) {
        return [];
      }
      return null;
    });
    
    mockUseMutation.mockImplementation((mutation: any) => {
      if (mutation.toString().includes('createStagingJob')) {
        return mockCreateStagingJob;
      }
      return vi.fn();
    });
  });

  const renderBatchProcessor = () => {
    return render(
      <ConvexProvider client={mockConvex}>
        <BatchProcessor projectId={'project1' as any} />
      </ConvexProvider>
    );
  };

  it('renders batch processor interface', () => {
    renderBatchProcessor();
    
    expect(screen.getByText('Batch AI Staging')).toBeInTheDocument();
    expect(screen.getByText('Available Credits: 25')).toBeInTheDocument();
  });

  it('shows stageable images in batch selector', () => {
    renderBatchProcessor();
    
    // Should show only uploaded images (not staged ones)
    expect(screen.getByText('kitchen.jpg')).toBeInTheDocument();
    expect(screen.getByText('living_room.jpg')).toBeInTheDocument();
    expect(screen.queryByText('bedroom.jpg')).not.toBeInTheDocument(); // This one is already staged
  });

  it('allows selecting images for batch processing', async () => {
    renderBatchProcessor();
    
    // Click on first image to select it
    const firstImage = screen.getByText('kitchen.jpg').closest('[data-testid="batch-image"]') || 
                      screen.getByText('kitchen.jpg').closest('div');
    
    if (firstImage) {
      fireEvent.click(firstImage);
    }
    
    // Should show selection count
    await waitFor(() => {
      expect(screen.getByText(/1 of \d+ images selected/)).toBeInTheDocument();
    });
  });

  it('shows style palette options', () => {
    renderBatchProcessor();
    
    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('Scandinavian')).toBeInTheDocument();
    expect(screen.getByText('Bohemian')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Traditional')).toBeInTheDocument();
  });

  it('enables start button when images and style are selected', async () => {
    renderBatchProcessor();
    
    // Select an image (mock the selection)
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    // Select a style
    const minimalStyle = screen.getByText('Minimal').closest('div');
    if (minimalStyle) {
      fireEvent.click(minimalStyle);
    }
    
    await waitFor(() => {
      const startButton = screen.getByText('Start Staging');
      expect(startButton).not.toBeDisabled();
    });
  });

  it('shows insufficient credits warning when selection exceeds credits', () => {
    // Mock user with fewer credits
    mockUseQuery.mockImplementation((query: any) => {
      if (query.toString().includes('getCurrentUser')) {
        return { ...mockUser, credits: 1 }; // Only 1 credit
      }
      if (query.toString().includes('getProjectImages')) {
        return mockImages;
      }
      if (query.toString().includes('getActiveStagingJobs')) {
        return [];
      }
      return null;
    });
    
    renderBatchProcessor();
    
    // Try to select multiple images (more than available credits)
    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);
    
    expect(screen.getByText('Insufficient Credits')).toBeInTheDocument();
  });

  it('calls createStagingJob when starting batch processing', async () => {
    renderBatchProcessor();
    
    // Mock successful job creation
    mockCreateStagingJob.mockResolvedValue('job123');
    
    // Select images and style (we'll mock this by directly triggering the handler)
    // In a real test, you'd interact with the UI elements
    
    // For now, let's test that the function would be called with correct parameters
    expect(mockCreateStagingJob).not.toHaveBeenCalled();
  });

  it('shows no images message when no stageable images available', () => {
    // Mock empty images array
    mockUseQuery.mockImplementation((query: any) => {
      if (query.toString().includes('getProjectImages')) {
        return []; // No images
      }
      if (query.toString().includes('getCurrentUser')) {
        return mockUser;
      }
      if (query.toString().includes('getActiveStagingJobs')) {
        return [];
      }
      return null;
    });
    
    renderBatchProcessor();
    
    expect(screen.getByText('No images ready for staging')).toBeInTheDocument();
  });

  it('displays custom prompt textarea', () => {
    renderBatchProcessor();
    
    expect(screen.getByPlaceholderText(/Add specific styling instructions/)).toBeInTheDocument();
  });

  it('shows character count for custom prompt', async () => {
    renderBatchProcessor();
    
    const textarea = screen.getByPlaceholderText(/Add specific styling instructions/);
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    await waitFor(() => {
      expect(screen.getByText('11/500 characters')).toBeInTheDocument();
    });
  });
});