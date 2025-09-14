import { render, screen } from "@testing-library/react";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { CreditStatus } from "./CreditStatus";

// Mock Convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useAction: vi.fn(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("CreditStatus", () => {
  let mockUseQuery: any;
  let mockUseAction: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        href: '',
      },
      writable: true,
    });

    // Get the mocked functions
    const convexReact = await import("convex/react");
    mockUseQuery = convexReact.useQuery;
    mockUseAction = convexReact.useAction;
  });

  test("should display credit balance", () => {
    mockUseQuery
      .mockReturnValueOnce({ _id: "user1", credits: 50, plan: "agent" }) // getCurrentUser
      .mockReturnValueOnce({ // getCreditStatus
        credits: 50,
        plan: "agent",
        isLowBalance: false,
        isZeroBalance: false,
        needsUpgrade: false,
      });
    
    mockUseAction.mockReturnValue(vi.fn());

    render(<CreditStatus />);
    
    expect(screen.getByText("50 credits")).toBeInTheDocument();
    expect(screen.getByText("AGENT")).toBeInTheDocument();
  });

  test("should show low balance warning", () => {
    mockUseQuery
      .mockReturnValueOnce({ _id: "user1", credits: 3, plan: "trial" }) // getCurrentUser
      .mockReturnValueOnce({ // getCreditStatus
        credits: 3,
        plan: "trial",
        isLowBalance: true,
        isZeroBalance: false,
        needsUpgrade: false,
      });
    
    mockUseAction.mockReturnValue(vi.fn());

    render(<CreditStatus />);
    
    expect(screen.getByText("You're running low on credits. Consider upgrading your plan.")).toBeInTheDocument();
    expect(screen.getByText("Upgrade")).toBeInTheDocument();
  });

  test("should show zero balance warning", () => {
    mockUseQuery
      .mockReturnValueOnce({ _id: "user1", credits: 0, plan: "trial" }) // getCurrentUser
      .mockReturnValueOnce({ // getCreditStatus
        credits: 0,
        plan: "trial",
        isLowBalance: true,
        isZeroBalance: true,
        needsUpgrade: true,
      });
    
    mockUseAction.mockReturnValue(vi.fn());

    render(<CreditStatus />);
    
    expect(screen.getByText("You're out of credits! Upgrade to continue staging images.")).toBeInTheDocument();
  });

  test("should show upgrade prompt for trial users", () => {
    mockUseQuery
      .mockReturnValueOnce({ _id: "user1", credits: 2, plan: "trial" }) // getCurrentUser
      .mockReturnValueOnce({ // getCreditStatus
        credits: 2,
        plan: "trial",
        isLowBalance: false,
        isZeroBalance: false,
        needsUpgrade: true,
      });
    
    mockUseAction.mockReturnValue(vi.fn());

    render(<CreditStatus />);
    
    expect(screen.getByText("Ready to unlock unlimited staging? Upgrade to get 100+ monthly credits.")).toBeInTheDocument();
    expect(screen.getByText("Upgrade Now")).toBeInTheDocument();
  });
});