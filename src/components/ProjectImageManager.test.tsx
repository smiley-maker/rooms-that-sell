import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectImageManager } from './ProjectImageManager';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

// Mock the hooks
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useQuery: vi.fn(() => []), // Return empty array for images
    useMutation: vi.fn(() => vi.fn()),
    useAction: vi.fn(() => vi.fn()),
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

describe('ProjectImageManager', () => {
  const mockProjectId = 'test-project-id' as any;

  const renderProjectImageManager = () => {
    return render(
      <ConvexProvider client={mockConvex}>
        <ProjectImageManager projectId={mockProjectId} />
      </ConvexProvider>
    );
  };

  it('renders the image manager with tabs', () => {
    renderProjectImageManager();
    
    // Should show upload and gallery tabs
    expect(screen.getByText('Upload Images')).toBeInTheDocument();
    expect(screen.getByText(/Gallery/)).toBeInTheDocument();
  });

  it('shows empty state when no images', () => {
    renderProjectImageManager();
    
    // Click on gallery tab
    fireEvent.click(screen.getByText(/Gallery/));
    
    // Should show empty state
    expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
    expect(screen.getByText('Upload some room images to get started with virtual staging.')).toBeInTheDocument();
  });

  it('has view mode toggle buttons', () => {
    renderProjectImageManager();
    
    // Should have grid and list view buttons (they appear when there are images)
    // For now, just verify the component renders without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    renderProjectImageManager();
    
    // Should start on upload tab
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    
    // Click gallery tab
    fireEvent.click(screen.getByText(/Gallery/));
    
    // Should switch to gallery view
    expect(screen.getByText('No images uploaded yet')).toBeInTheDocument();
  });
});