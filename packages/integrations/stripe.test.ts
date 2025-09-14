import { describe, it, expect, vi, beforeEach } from "vitest";
import * as stripeAdapter from "@integrations/stripe";

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: "sess_123", url: "https://stripe.com/checkout" }),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://stripe.com/portal" }),
        },
      },
    })),
  };
});

describe("Stripe adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates checkout session", async () => {
    const res = await stripeAdapter.createCheckoutSession({
      customerEmail: "a@b.com",
      priceId: "price_123",
      userId: "user_1",
      plan: "pro",
      successUrl: "https://app/success",
      cancelUrl: "https://app/cancel",
    });
    expect(res.sessionId).toBe("sess_123");
    expect(res.url).toContain("stripe.com/checkout");
  });

  it("creates portal session", async () => {
    const res = await stripeAdapter.createPortalSession({
      customerId: "cus_123",
      returnUrl: "https://app/account",
    });
    expect(res.url).toContain("stripe.com/portal");
  });
});


