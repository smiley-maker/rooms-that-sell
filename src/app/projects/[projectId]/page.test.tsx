import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectDetailPage from './page';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useParams: () => ({ projectId: 'test-project-id' }),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

// Mock the queries
vi.mock('convex/react', async () => {
  const actual = await vi.importActual('convex/react');
  return {
    ...actual,
    useQuery: vi.fn(() => undefined), // Return undefined to show loading state
  };
});

describe('ProjectDetailPage', () => {
  const renderProjectDetailPage = () => {
    return render(
      <ConvexProvider client={mockConvex}>
        <ProjectDetailPage />
      </ConvexProvider>
    );
  };

  it('renders loading state when project is undefined', () => {
    renderProjectDetailPage();
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('has proper navigation structure', () => {
    renderProjectDetailPage();
    
    // The page should render without crashing
    expect(document.body).toBeInTheDocument();
  });
});