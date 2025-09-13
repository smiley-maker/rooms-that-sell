import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import Home from "./page";

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Clerk authentication
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs');
  return {
    ...actual,
    useUser: () => ({
      isSignedIn: false,
      isLoaded: true,
      user: null,
    }),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

describe("Home page", () => {
  it("renders without crashing", () => {
    render(
      <ConvexProvider client={mockConvex}>
        <Home />
      </ConvexProvider>
    );
    
    // Check that the page renders without errors
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    
    // Check for multiple sections
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
    
    // Check for interactive elements
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
