import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user profile when they sign up via Clerk
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update last active time
      await ctx.db.patch(existingUser._id, {
        lastActiveAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user with trial credits
    const plan = args.plan || "trial";
    const trialCredits = 10; // Free trial credits as per requirement 1.3

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email.toLowerCase().trim(),
      plan,
      credits: trialCredits,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    // Create initial credit transaction for trial credits
    await ctx.db.insert("creditTransactions", {
      userId,
      type: "bonus",
      amount: trialCredits,
      description: "Free trial credits",
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Get user profile by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user profile by user ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Update user's last active time
export const updateLastActive = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Update user subscription plan
export const updateUserPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.string(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      plan: args.plan,
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

// Deduct credits from user account
export const deductCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    relatedJobId: v.optional(v.id("stagingJobs")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < args.amount) {
      throw new Error("Insufficient credits");
    }

    // Update user credits
    await ctx.db.patch(args.userId, {
      credits: user.credits - args.amount,
    });

    // Record credit transaction
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: "usage",
      amount: -args.amount,
      description: args.description,
      relatedJobId: args.relatedJobId,
      createdAt: Date.now(),
    });

    return user.credits - args.amount;
  },
});

// Add credits to user account
export const addCredits = mutation({
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

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

// Get user's credit transaction history
export const getCreditHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});