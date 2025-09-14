import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';

// Mock Clerk
const mockUseUser = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-up-button">{children}</div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, size, variant, ...props }: any) => (
    <button 
      className={className} 
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when Clerk is not loaded', () => {
    mockUseUser.mockReturnValue({
      isSignedIn: false,
      isLoaded: false,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows login/signup UI when user is not signed in', () => {
    mockUseUser.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Welcome to RoomsThatSell')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access your dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('sign-up-button')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows protected content when user is signed in', () => {
    mockUseUser.mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
    });

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to RoomsThatSell')).not.toBeInTheDocument();
  });

  it('shows custom fallback when provided and user is not signed in', () => {
    mockUseUser.mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
    });

    render(
      <AuthGuard fallback={<div>Custom fallback</div>}>
        <div>Protected content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to RoomsThatSell')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
