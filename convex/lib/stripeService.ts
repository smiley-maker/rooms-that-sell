/**
 * Stripe Service - Dependency injection pattern
 * This service encapsulates Stripe operations and can be injected into functions
 * without creating circular dependencies.
 */

// Deprecated file retained for backward compatibility with minimal surface area

// Deprecated: replaced by packages/integrations/stripe.ts adapter
export type StripeServiceInterface = object;

export class StripeService implements StripeServiceInterface {}
export function createStripeService(): StripeServiceInterface { return new StripeService(); }
