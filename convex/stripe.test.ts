import { expect, test, describe } from "vitest";
import { STRIPE_PLANS, getPlanConfig } from "./lib/stripeConfig";

describe("Stripe Integration", () => {

  test("should have correct plan configurations", () => {
    expect(STRIPE_PLANS.trial.credits).toBe(10);
    expect(STRIPE_PLANS.trial.price).toBe(0);
    expect(STRIPE_PLANS.trial.priceId).toBeNull();

    expect(STRIPE_PLANS.agent.credits).toBe(100);
    expect(STRIPE_PLANS.agent.price).toBe(29);
    expect(STRIPE_PLANS.agent.name).toBe("Agent Plan");

    expect(STRIPE_PLANS.pro.credits).toBe(300);
    expect(STRIPE_PLANS.pro.price).toBe(79);
    expect(STRIPE_PLANS.pro.name).toBe("Pro Plan");

    expect(STRIPE_PLANS.business.credits).toBe(1000);
    expect(STRIPE_PLANS.business.price).toBe(199);
    expect(STRIPE_PLANS.business.name).toBe("Business Plan");
  });

  test("should validate plan keys", () => {
    const planKeys = Object.keys(STRIPE_PLANS);
    expect(planKeys).toContain("trial");
    expect(planKeys).toContain("agent");
    expect(planKeys).toContain("pro");
    expect(planKeys).toContain("business");
    expect(planKeys).toHaveLength(4);
  });

  test("should have increasing credit amounts for higher plans", () => {
    expect(STRIPE_PLANS.trial.credits).toBeLessThan(STRIPE_PLANS.agent.credits);
    expect(STRIPE_PLANS.agent.credits).toBeLessThan(STRIPE_PLANS.pro.credits);
    expect(STRIPE_PLANS.pro.credits).toBeLessThan(STRIPE_PLANS.business.credits);
  });

  test("should return trial plan config correctly", () => {
    const trialConfig = getPlanConfig("trial");
    expect(trialConfig.credits).toBe(10);
    expect(trialConfig.price).toBe(0);
    expect(trialConfig.priceId).toBeNull();
  });

  test("should throw error for invalid plan", () => {
    expect(() => getPlanConfig("invalid")).toThrow("Invalid plan: invalid");
  });

  test("should handle paid plans with environment variables", () => {
    // Mock environment variables for testing
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      STRIPE_AGENT_PRICE_ID: "price_test_agent",
      STRIPE_PRO_PRICE_ID: "price_test_pro",
      STRIPE_BUSINESS_PRICE_ID: "price_test_business",
    };

    try {
      const agentConfig = getPlanConfig("agent");
      expect(agentConfig.priceId).toBe("price_test_agent");
      
      const proConfig = getPlanConfig("pro");
      expect(proConfig.priceId).toBe("price_test_pro");
      
      const businessConfig = getPlanConfig("business");
      expect(businessConfig.priceId).toBe("price_test_business");
    } finally {
      // Restore original environment
      process.env = originalEnv;
    }
  });
});