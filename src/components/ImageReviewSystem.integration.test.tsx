import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImageReviewSystem } from './ImageReviewSystem';

// Mock all the dependencies
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => []),
}));

vi.mock('./ImageComparisonSlider', () => ({
  ImageComparisonSlider: () => <div data-testid="comparison-slider">Comparison Slider</div>,
}));

vi.mock('./ImageApprovalWorkflow', () => ({
  ImageApprovalWorkflow: () => <div data-testid="approval-workflow">Approval Workflow</div>,
}));

vi.mock('./ImageDetailViewer', () => ({
  ImageDetailViewer: () => <div data-testid="detail-viewer">Detail Viewer</div>,
}));

describe('ImageReviewSystem Integration', () => {
  it('renders without crashing', () => {
    render(<ImageReviewSystem projectId="test-project" />);
    
    // When no images, it shows the empty state
    expect(screen.getByText('No staged images to review')).toBeInTheDocument();
  });

  it('shows empty state when no images', () => {
    render(<ImageReviewSystem projectId="test-project" />);
    
    expect(screen.getByText('No staged images to review')).toBeInTheDocument();
  });
});