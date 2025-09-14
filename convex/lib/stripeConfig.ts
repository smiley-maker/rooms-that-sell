/**
 * Shared Stripe configuration constants
 * This module contains shared constants that can be imported by both
 * Convex functions and frontend components without circular dependencies.
 */

export const STRIPE_PLANS = {
  trial: {
    name: "Free Trial",
    credits: 10,
    price: 0,
    priceId: null,
    features: ["10 staging credits", "Basic support", "Standard quality"],
  },
  agent: {
    name: "Agent Plan",
    credits: 100,
    price: 29,
    priceId: null, // Will be set dynamically
    features: ["100 monthly credits", "Priority support", "High quality", "Batch processing"],
  },
  pro: {
    name: "Pro Plan", 
    credits: 300,
    price: 79,
    priceId: null, // Will be set dynamically
    features: ["300 monthly credits", "Premium support", "Highest quality", "Advanced features", "Custom styles"],
  },
  business: {
    name: "Business Plan",
    credits: 1000,
    price: 199,
    priceId: null, // Will be set dynamically
    features: ["1000 monthly credits", "Dedicated support", "Enterprise features", "API access", "White-label options"],
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

export const STRIPE_CONFIG = {
  apiVersion: "2025-08-27.basil" as const,
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET;
  },
  get secretKey() {
    return process.env.STRIPE_SECRET_KEY;
  },
} as const;

// Helper functions for plan validation
export function isValidPlan(plan: string): plan is StripePlanKey {
  return plan in STRIPE_PLANS;
}

export function getPlanConfig(plan: string) {
  if (!isValidPlan(plan)) {
    throw new Error(`Invalid plan: ${plan}`);
  }
  const planConfig = STRIPE_PLANS[plan];
  
  // For paid plans, get the price ID from environment variables
  if (plan !== 'trial' && planConfig.priceId === null) {
    const priceId = getPriceIdForPlan(plan);
    return {
      ...planConfig,
      priceId,
    };
  }
  
  return planConfig;
}

function getPriceIdForPlan(plan: string): string {
  switch (plan) {
    case 'agent':
      return process.env.STRIPE_AGENT_PRICE_ID!;
    case 'pro':
      return process.env.STRIPE_PRO_PRICE_ID!;
    case 'business':
      return process.env.STRIPE_BUSINESS_PRICE_ID!;
    default:
      throw new Error(`No price ID configured for plan: ${plan}`);
  }
}
