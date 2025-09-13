import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { ClerkProvider } from "@clerk/nextjs";
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

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

describe("Home page", () => {
  it("renders without crashing", () => {
    render(
      <ClerkProvider publishableKey="pk_test_Y2xlcmsuaW5jbHVkZWQua2F0eWRpZC05Mi5sY2wuZGV2JA">
        <ConvexProvider client={mockConvex}>
          <Home />
        </ConvexProvider>
      </ClerkProvider>
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
