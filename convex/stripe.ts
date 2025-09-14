import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getPlanConfig } from "./lib/stripeConfig";
import { createStripeService } from "./lib/stripeService";

// Create Stripe checkout session
export const createCheckoutSession = action({
  args: {
    userId: v.id("users"),
    plan: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null }> => {
    const stripeService = createStripeService();
    
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user) {
      throw new Error("User not found");
    }

    const planConfig = getPlanConfig(args.plan);
    if (!planConfig.priceId) {
      throw new Error("Invalid plan selected");
    }

    return await stripeService.createCheckoutSession({
      customerEmail: user.email,
      priceId: planConfig.priceId,
      userId: args.userId,
      plan: args.plan,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
    });
  },
});

// Create Stripe customer portal session
export const createPortalSession = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const stripeService = createStripeService();
    
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user || !user.stripeCustomerId) {
      throw new Error("User not found or no Stripe customer ID");
    }

    return await stripeService.createPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: args.returnUrl,
    });
  },
});

// Handle successful subscription creation
export const handleSubscriptionCreated = mutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Use internal function to avoid circular dependency
    await ctx.runMutation(internal.lib.stripeInternal.handleSubscriptionCreatedInternal, args);
  },
});

// Handle subscription updates
export const handleSubscriptionUpdated = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.runQuery(internal.lib.stripeInternal.getSubscriptionByStripeId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });

    if (subscription) {
      await ctx.runMutation(internal.lib.stripeInternal.updateSubscriptionInternal, {
        subscriptionId: subscription._id,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      });
    }
  },
});

// Handle subscription renewal (add monthly credits)
export const handleSubscriptionRenewal = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.runQuery(internal.lib.stripeInternal.getSubscriptionByStripeId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Update subscription period
    await ctx.runMutation(internal.lib.stripeInternal.updateSubscriptionInternal, {
      subscriptionId: subscription._id,
      status: subscription.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    });

    // Add monthly credits
    const planConfig = getPlanConfig(subscription.plan);
    await ctx.runMutation(internal.lib.stripeInternal.addCreditsInternal, {
      userId: subscription.userId,
      amount: planConfig.credits,
      description: `Monthly credits renewal for ${planConfig.name}`,
      type: "purchase",
    });
  },
});

// Get user's subscription details
export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{
    _id: string;
    _creationTime: number;
    userId: string;
    stripeSubscriptionId: string;
    plan: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    createdAt: number;
    updatedAt: number;
  } | null> => {
    const subscription = await ctx.runQuery(internal.lib.stripeInternal.getSubscriptionByUserIdInternal, {
      userId: args.userId,
    });
    return subscription;
  },
});

// Cancel subscription
export const cancelSubscription = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const stripeService = createStripeService();
    
    // Get subscription using internal function to avoid circular dependency
    const subscription = await ctx.runQuery(internal.lib.stripeInternal.getSubscriptionByUserIdInternal, { 
      userId: args.userId 
    });
    if (!subscription) {
      throw new Error("No active subscription found");
    }

    await stripeService.updateSubscription({
      subscriptionId: subscription.stripeSubscriptionId,
      cancelAtPeriodEnd: true,
    });

    await ctx.runMutation(internal.lib.stripeInternal.updateSubscriptionInternal, {
      subscriptionId: subscription._id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: true,
    });

    return { success: true };
  },
});