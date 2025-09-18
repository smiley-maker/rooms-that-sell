import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const claimUsage = mutation({
  args: {
    toolSlug: v.string(),
    ipHash: v.string(),
    limit: v.number(),
    windowMs: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("toolUsage")
      .withIndex("by_tool_ip", (q) => q.eq("toolSlug", args.toolSlug).eq("ipHash", args.ipHash))
      .unique();

    const now = args.timestamp;
    const windowMs = Math.max(args.windowMs, 60_000);

    if (!existing) {
      const recordId = await ctx.db.insert("toolUsage", {
        toolSlug: args.toolSlug,
        ipHash: args.ipHash,
        count: 1,
        windowStartedAt: now,
        lastUsedAt: now,
      });
      return {
        allowed: true,
        recordId,
        remaining: args.limit - 1,
        windowEndsAt: now + windowMs,
      } as const;
    }

    let count = existing.count;
    let windowStartedAt = existing.windowStartedAt;

    if (now >= existing.windowStartedAt + windowMs) {
      count = 0;
      windowStartedAt = now;
    }

    if (count >= args.limit) {
      return {
        allowed: false,
        recordId: existing._id,
        remaining: 0,
        windowEndsAt: windowStartedAt + windowMs,
      } as const;
    }

    const newCount = count + 1;
    await ctx.db.patch(existing._id, {
      count: newCount,
      windowStartedAt,
      lastUsedAt: now,
    });

    return {
      allowed: true,
      recordId: existing._id,
      remaining: Math.max(0, args.limit - newCount),
      windowEndsAt: windowStartedAt + windowMs,
    } as const;
  },
});

export const revertUsage = mutation({
  args: {
    recordId: v.id("toolUsage"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) return;

    const newCount = Math.max(0, record.count - 1);
    await ctx.db.patch(args.recordId, {
      count: newCount,
      lastUsedAt: Date.now(),
    });
  },
});
