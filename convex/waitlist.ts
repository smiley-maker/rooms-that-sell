import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const join = mutation({
  args: {
    email: v.string(),
    listingsPerMonth: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existing) return existing._id;

    const id = await ctx.db.insert("waitlist", {
      email: normalizedEmail,
      listingsPerMonth: args.listingsPerMonth ?? "",
      createdAt: Date.now(),
      source: args.source ?? "landing",
    });
    return id;
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("waitlist").collect();
    return all.length;
  },
});


