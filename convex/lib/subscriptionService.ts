/**
 * Subscription Service - Business logic abstraction
 * This service handles subscription-related business logic without
 * directly depending on Stripe or Convex API, reducing circular dependencies.
 */

import { STRIPE_PLANS, getPlanConfig } from "./stripeConfig";

export interface User {
  _id: string;
  email: string;
  plan: string;
  credits: number;
  stripeCustomerId?: string;
}

export interface Subscription {
  _id: string;
  userId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface CreditTransaction {
  userId: string;
  type: string;
  amount: number;
  description: string;
  createdAt: number;
}

export interface SubscriptionServiceInterface {
  validatePlan(plan: string): boolean;
  calculateCreditsForPlan(plan: string): number;
  createSubscriptionRecord(params: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    plan: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }): Subscription;
  createCreditTransaction(params: {
    userId: string;
    amount: number;
    description: string;
    type?: string;
  }): CreditTransaction;
  updateUserPlan(user: User, plan: string, stripeCustomerId?: string): Partial<User>;
}

export class SubscriptionService implements SubscriptionServiceInterface {
  validatePlan(plan: string): boolean {
    return plan in STRIPE_PLANS;
  }

  calculateCreditsForPlan(plan: string): number {
    const planConfig = getPlanConfig(plan);
    return planConfig.credits;
  }

  createSubscriptionRecord(params: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    plan: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  }): Subscription {
    return {
      _id: "", // Will be set by Convex
      userId: params.userId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      plan: params.plan,
      status: params.status,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: false,
    };
  }

  createCreditTransaction(params: {
    userId: string;
    amount: number;
    description: string;
    type?: string;
  }): CreditTransaction {
    return {
      userId: params.userId,
      type: params.type || "purchase",
      amount: params.amount,
      description: params.description,
      createdAt: Date.now(),
    };
  }

  updateUserPlan(user: User, plan: string, stripeCustomerId?: string): Partial<User> {
    return {
      plan,
      ...(stripeCustomerId && { stripeCustomerId }),
    };
  }

  // Business logic methods
  shouldAddCreditsOnSubscription(plan: string): boolean {
    return this.validatePlan(plan) && plan !== "trial";
  }

  getPlanDisplayName(plan: string): string {
    const planConfig = getPlanConfig(plan);
    return planConfig.name;
  }

  isActiveSubscription(status: string): boolean {
    return status === "active";
  }

  shouldCancelAtPeriodEnd(status: string): boolean {
    return status === "canceled";
  }
}

// Factory function
export function createSubscriptionService(): SubscriptionServiceInterface {
  return new SubscriptionService();
}
