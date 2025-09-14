/**
 * Stripe Events - Event-driven architecture
 * This module defines events and handlers for Stripe webhook processing
 * without creating circular dependencies.
 */

export interface StripeEventData {
  eventType: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SubscriptionCreatedEvent extends StripeEventData {
  eventType: "subscription.created";
  data: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    plan: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  };
}

export interface SubscriptionUpdatedEvent extends StripeEventData {
  eventType: "subscription.updated";
  data: {
    stripeSubscriptionId: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  };
}

export interface SubscriptionRenewedEvent extends StripeEventData {
  eventType: "subscription.renewed";
  data: {
    stripeSubscriptionId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  };
}

export interface SubscriptionCanceledEvent extends StripeEventData {
  eventType: "subscription.canceled";
  data: {
    stripeSubscriptionId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
  };
}

export type StripeEvent = 
  | SubscriptionCreatedEvent 
  | SubscriptionUpdatedEvent 
  | SubscriptionRenewedEvent 
  | SubscriptionCanceledEvent;

// Event factory functions
export function createSubscriptionCreatedEvent(data: SubscriptionCreatedEvent["data"]): SubscriptionCreatedEvent {
  return {
    eventType: "subscription.created",
    timestamp: Date.now(),
    data,
  };
}

export function createSubscriptionUpdatedEvent(data: SubscriptionUpdatedEvent["data"]): SubscriptionUpdatedEvent {
  return {
    eventType: "subscription.updated",
    timestamp: Date.now(),
    data,
  };
}

export function createSubscriptionRenewedEvent(data: SubscriptionRenewedEvent["data"]): SubscriptionRenewedEvent {
  return {
    eventType: "subscription.renewed",
    timestamp: Date.now(),
    data,
  };
}

export function createSubscriptionCanceledEvent(data: SubscriptionCanceledEvent["data"]): SubscriptionCanceledEvent {
  return {
    eventType: "subscription.canceled",
    timestamp: Date.now(),
    data,
  };
}

// Event validation
export function isValidStripeEvent(event: unknown): event is StripeEvent {
  if (event === null || typeof event !== "object") {
    return false;
  }
  
  const eventObj = event as Record<string, unknown>;
  
  return (
    "eventType" in eventObj &&
    "timestamp" in eventObj &&
    "data" in eventObj &&
    typeof eventObj.eventType === "string" &&
    typeof eventObj.timestamp === "number" &&
    typeof eventObj.data === "object" &&
    ["subscription.created", "subscription.updated", "subscription.renewed", "subscription.canceled"].includes(eventObj.eventType)
  );
}

// Event processing interface
export interface StripeEventHandler {
  handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void>;
  handleSubscriptionUpdated(event: SubscriptionUpdatedEvent): Promise<void>;
  handleSubscriptionRenewed(event: SubscriptionRenewedEvent): Promise<void>;
  handleSubscriptionCanceled(event: SubscriptionCanceledEvent): Promise<void>;
}

// Event dispatcher
export class StripeEventDispatcher {
  private handlers: StripeEventHandler[] = [];

  registerHandler(handler: StripeEventHandler) {
    this.handlers.push(handler);
  }

  async dispatchEvent(event: StripeEvent): Promise<void> {
    for (const handler of this.handlers) {
      try {
        switch (event.eventType) {
          case "subscription.created":
            await handler.handleSubscriptionCreated(event as SubscriptionCreatedEvent);
            break;
          case "subscription.updated":
            await handler.handleSubscriptionUpdated(event as SubscriptionUpdatedEvent);
            break;
          case "subscription.renewed":
            await handler.handleSubscriptionRenewed(event as SubscriptionRenewedEvent);
            break;
          case "subscription.canceled":
            await handler.handleSubscriptionCanceled(event as SubscriptionCanceledEvent);
            break;
        }
      } catch (error) {
        console.error(`Error handling ${event.eventType}:`, error);
        // Continue processing other handlers
      }
    }
  }
}
