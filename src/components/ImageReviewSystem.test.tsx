import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ImageReviewSystem } from './ImageReviewSystem';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock components
vi.mock('./ImageComparisonSlider', () => ({
  ImageComparisonSlider: ({ imageId }: { imageId: string }) => (
    <div data-testid={`comparison-slider-${imageId}`}>Comparison Slider</div>
  ),
}));

vi.mock('./ImageApprovalWorkflow', () => ({
  ImageApprovalWorkflow: ({ imageId, currentStatus }: { imageId: string; currentStatus: string }) => (
    <div data-testid={`approval-workflow-${imageId}`}>
      Approval Workflow - {currentStatus}
    </div>
  ),
}));

vi.mock('./ImageDetailViewer', () => ({
  ImageDetailViewer: ({ imageId, isOpen }: { imageId: string; isOpen: boolean }) => (
    isOpen ? <div data-testid={`detail-viewer-${imageId}`}>Detail Viewer</div> : null
  ),
}));

const mockImages = [
  {
    _id: 'img1' as any,
    filename: 'kitchen.jpg',
    status: 'staged',
    roomType: 'kitchen',
    originalUrl: 'https://example.com/original1.jpg',
    stagedUrl: 'https://example.com/staged1.jpg',
    metadata: {
      stylePreset: 'modern',
      confidence: 0.95,
    },
    fileSize: 1024000,
    dimensions: { width: 1920, height: 1080 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    _id: 'img2' as any,
    filename: 'living_room.jpg',
    status: 'approved',
    roomType: 'living_room',
    originalUrl: 'https://example.com/original2.jpg',
    stagedUrl: 'https://example.com/staged2.jpg',
    metadata: {
      stylePreset: 'scandinavian',
      confidence: 0.88,
    },
    fileSize: 2048000,
    dimensions: { width: 1920, height: 1080 },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('ImageReviewSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (images = mockImages) => {
    const convexReact = require('convex/react');
    convexReact.useQuery.mockReturnValue(images);

    return render(<ImageReviewSystem projectId="project1" />);
  };

  it('renders empty state when no staged images', () => {
    renderComponent([]);
    
    expect(screen.getByText('No staged images to review')).toBeInTheDocument();
    expect(screen.getByText('Stage some images first to see them here for review and approval.')).toBeInTheDocument();
  });

  it('renders summary statistics correctly', () => {
    renderComponent();
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending Review (staged)
    expect(screen.getByText('1')).toBeInTheDocument(); // Approved
    expect(screen.getByText('0')).toBeInTheDocument(); // Exported
  });

  it('switches between gallery and kanban views', () => {
    renderComponent();
    
    const kanbanButton = screen.getByRole('button', { name: /kanban/i });
    fireEvent.click(kanbanButton);
    
    expect(screen.getByText('Staged (1)')).toBeInTheDocument();
    expect(screen.getByText('Approved (1)')).toBeInTheDocument();
    expect(screen.getByText('Exported (0)')).toBeInTheDocument();
  });

  it('displays images in gallery view', () => {
    renderComponent();
    
    expect(screen.getByText('kitchen.jpg')).toBeInTheDocument();
    expect(screen.getByText('living_room.jpg')).toBeInTheDocument();
    expect(screen.getByTestId('comparison-slider-img1')).toBeInTheDocument();
    expect(screen.getByTestId('comparison-slider-img2')).toBeInTheDocument();
  });

  it('shows approval workflows for each image', () => {
    renderComponent();
    
    expect(screen.getByTestId('approval-workflow-img1')).toBeInTheDocument();
    expect(screen.getByTestId('approval-workflow-img2')).toBeInTheDocument();
    expect(screen.getByText('Approval Workflow - staged')).toBeInTheDocument();
    expect(screen.getByText('Approval Workflow - approved')).toBeInTheDocument();
  });

  it('opens detail viewer when view details is clicked', async () => {
    renderComponent();
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('detail-viewer-img1')).toBeInTheDocument();
    });
  });

  it('displays room type and style preset badges', () => {
    renderComponent();
    
    expect(screen.getByText('kitchen')).toBeInTheDocument();
    expect(screen.getByText('living room')).toBeInTheDocument();
    expect(screen.getByText('modern')).toBeInTheDocument();
    expect(screen.getByText('scandinavian')).toBeInTheDocument();
  });

  it('shows correct status badges', () => {
    renderComponent();
    
    expect(screen.getByText('staged')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  it('organizes images by status in kanban view', () => {
    renderComponent();
    
    const kanbanButton = screen.getByRole('button', { name: /kanban/i });
    fireEvent.click(kanbanButton);
    
    // Check that images are in correct columns
    expect(screen.getByText('Staged (1)')).toBeInTheDocument();
    expect(screen.getByText('Approved (1)')).toBeInTheDocument();
    expect(screen.getByText('Exported (0)')).toBeInTheDocument();
  });
});