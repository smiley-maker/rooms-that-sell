/**
 * Stripe Service - Dependency injection pattern
 * This service encapsulates Stripe operations and can be injected into functions
 * without creating circular dependencies.
 */

import Stripe from "stripe";
import { STRIPE_CONFIG } from "./stripeConfig";

export interface StripeServiceInterface {
  createCheckoutSession(params: {
    customerEmail: string;
    priceId: string;
    userId: string;
    plan: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string | null }>;
  
  createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;
  
  updateSubscription(params: {
    subscriptionId: string;
    cancelAtPeriodEnd: boolean;
  }): Promise<void>;
  
  retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription>;
}

export class StripeService implements StripeServiceInterface {
  private stripe: Stripe;

  constructor() {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error("Stripe secret key not configured");
    }
    
    this.stripe = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion,
    });
  }

  async createCheckoutSession(params: {
    customerEmail: string;
    priceId: string;
    userId: string;
    plan: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: params.customerEmail,
        payment_method_types: ["card"],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
          plan: params.plan,
        },
        subscription_data: {
          metadata: {
            userId: params.userId,
            plan: params.plan,
          },
        },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error("Stripe checkout session creation failed:", error);
      throw new Error("Failed to create checkout session");
    }
  }

  async createPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }) {
    try {
      // First, check if the customer exists and has billing history
      const customer = await this.stripe.customers.retrieve(params.customerId);
      
      if (!customer || customer.deleted) {
        throw new Error(`Customer ${params.customerId} not found or deleted`);
      }

      // Check if customer has any billing history (invoices, payment methods, etc.)
      const invoices = await this.stripe.invoices.list({
        customer: params.customerId,
        limit: 1,
      });

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: params.customerId,
        type: 'card',
        limit: 1,
      });

      if (invoices.data.length === 0 && paymentMethods.data.length === 0) {
        throw new Error("Customer must have billing history to access customer portal");
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      return { url: session.url };
    } catch (error) {
      console.error("Stripe portal session creation failed:", error);
      console.error("Customer ID:", params.customerId);
      console.error("Return URL:", params.returnUrl);
      console.error("Error details:", error instanceof Error ? error.message : String(error));
      throw new Error(`Failed to create portal session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateSubscription(params: {
    subscriptionId: string;
    cancelAtPeriodEnd: boolean;
  }) {
    try {
      await this.stripe.subscriptions.update(params.subscriptionId, {
        cancel_at_period_end: params.cancelAtPeriodEnd,
      });
    } catch (error) {
      console.error("Failed to update subscription:", error);
      throw new Error("Failed to update subscription");
    }
  }

  async retrieveSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error("Failed to retrieve subscription:", error);
      throw new Error("Failed to retrieve subscription");
    }
  }
}

// Factory function for creating service instances
export function createStripeService(): StripeServiceInterface {
  return new StripeService();
}
