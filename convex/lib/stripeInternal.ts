/**
 * Stripe Internal Functions - Convex internal functions
 * These are internal functions that can be called without circular dependencies
 * and handle the core Stripe operations.
 */

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getPlanConfig } from "./stripeConfig";

// Internal function to get subscription by Stripe ID
export const getSubscriptionByStripeId = internalQuery({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) => 
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();
  },
});

// Internal function to get user by ID
export const getUserByIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Internal function to create subscription record
export const createSubscriptionInternal = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      plan: args.plan,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Internal function to update subscription
export const updateSubscriptionInternal = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    });
  },
});

// Internal function to update user with Stripe data
export const updateUserStripeDataInternal = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      plan: args.plan,
    });
  },
});

// Internal function to add credits to user
export const addCreditsInternal = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update user credits
    const newCredits = user.credits + args.amount;
    await ctx.db.patch(args.userId, {
      credits: newCredits,
    });

    // Record credit transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: args.type || "purchase",
      amount: args.amount,
      description: args.description,
      createdAt: Date.now(),
    });

    return newCredits;
  },
});

// Internal function to get subscription by user ID
export const getSubscriptionByUserIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();
  },
});

// Internal function to handle subscription creation with credits
export const handleSubscriptionCreatedInternal = internalMutation({
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
    // Update user with Stripe customer ID and plan
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      plan: args.plan,
    });

    // Create subscription record
    await ctx.db.insert("subscriptions", {
      userId: args.userId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      plan: args.plan,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add monthly credits for the plan
    const planConfig = getPlanConfig(args.plan);
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        credits: user.credits + planConfig.credits,
      });
      
      await ctx.db.insert("creditTransactions", {
        userId: args.userId,
        type: "purchase",
        amount: planConfig.credits,
        description: `Monthly credits for ${planConfig.name}`,
        createdAt: Date.now(),
      });
    }
  },
});
