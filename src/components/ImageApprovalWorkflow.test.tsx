import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ImageApprovalWorkflow } from './ImageApprovalWorkflow';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Convex
const mockUpdateImageStatus = vi.fn();

vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useMutation: vi.fn(() => mockUpdateImageStatus),
    ConvexProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ImageApprovalWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateImageStatus.mockResolvedValue({ success: true });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      imageId: 'img1' as any,
      currentStatus: 'staged',
      onStatusChange: vi.fn(),
    };

    const { ConvexProvider } = require('convex/react');
    
    return render(
      <ConvexProvider>
        <ImageApprovalWorkflow {...defaultProps} {...props} />
      </ConvexProvider>
    );
  };

  it('renders approve and regenerate buttons for staged status', () => {
    renderComponent();
    
    expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
  });

  it('renders approved status with unapprove option', () => {
    renderComponent({ currentStatus: 'approved' });
    
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unapprove/i })).toBeInTheDocument();
  });

  it('renders exported status without actions', () => {
    renderComponent({ currentStatus: 'exported' });
    
    expect(screen.getByText('Exported')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles approve action', async () => {
    const onStatusChange = vi.fn();
    renderComponent({ onStatusChange });
    
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(mockUpdateImageStatus).toHaveBeenCalledWith({
        imageId: 'img1',
        status: 'approved'
      });
    });
    
    expect(onStatusChange).toHaveBeenCalled();
  });

  it('handles reject/unapprove action', async () => {
    const onStatusChange = vi.fn();
    renderComponent({ currentStatus: 'approved', onStatusChange });
    
    const unapproveButton = screen.getByRole('button', { name: /unapprove/i });
    fireEvent.click(unapproveButton);
    
    await waitFor(() => {
      expect(mockUpdateImageStatus).toHaveBeenCalledWith({
        imageId: 'img1',
        status: 'staged'
      });
    });
    
    expect(onStatusChange).toHaveBeenCalled();
  });

  it('shows regenerate confirmation dialog', async () => {
    renderComponent();
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenerateButton);
    
    expect(screen.getByText('Regenerate Image')).toBeInTheDocument();
    expect(screen.getByText(/This will queue the image for re-staging/)).toBeInTheDocument();
  });

  it('handles regenerate confirmation', async () => {
    const onStatusChange = vi.fn();
    renderComponent({ onStatusChange });
    
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenerateButton);
    
    const confirmButton = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockUpdateImageStatus).toHaveBeenCalledWith({
        imageId: 'img1',
        status: 'uploaded'
      });
    });
    
    expect(onStatusChange).toHaveBeenCalled();
  });

  it('renders in compact mode', () => {
    renderComponent({ compact: true });
    
    const approveButton = screen.getByRole('button', { name: /approve/i });
    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    
    expect(approveButton).toBeInTheDocument();
    expect(regenerateButton).toBeInTheDocument();
    
    // In compact mode, buttons should not have text labels
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
  });

  it('shows loading state during operations', async () => {
    mockUpdateImageStatus.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderComponent();
    
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    // Should show loading spinner
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles errors gracefully', async () => {
    const { toast } = require('sonner');
    mockUpdateImageStatus.mockRejectedValue(new Error('Network error'));
    
    renderComponent();
    
    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to approve image');
    });
  });
});