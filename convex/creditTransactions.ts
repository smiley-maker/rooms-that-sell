import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a credit transaction record
 */
export const createTransaction = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
    description: v.string(),
    relatedJobId: v.optional(v.id("stagingJobs")),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      description: args.description,
      relatedJobId: args.relatedJobId,
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Get credit transactions for a user
 */
export const getUserTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

/**
 * Get transactions by type
 */
export const getTransactionsByType = query({
  args: {
    userId: v.id("users"),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return transactions;
  },
});