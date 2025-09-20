import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_DAILY_LIMIT = 3;

const generateSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const initializeSession = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    email: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    dailyLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.max(1, args.dailyLimit ?? DEFAULT_DAILY_LIMIT);
    const normalizedToken = args.sessionToken?.trim();

    if (normalizedToken) {
      const existing = await ctx.db
        .query("beforeAfterVideoSessions")
        .withIndex("by_sessionToken", (q) => q.eq("sessionToken", normalizedToken))
        .unique();

      if (existing) {
        const patch: Record<string, unknown> = {};
        if (args.email && !existing.email) {
          patch.email = args.email.trim().toLowerCase();
        }
        if (args.ipHash && existing.lastKnownIpHash !== args.ipHash) {
          patch.lastKnownIpHash = args.ipHash;
        }
        if (Object.keys(patch).length > 0) {
          patch.updatedAt = now;
          await ctx.db.patch(existing._id, patch);
        }

        return {
          sessionId: existing._id,
          sessionToken: existing.sessionToken,
          dailyGenerationLimit: existing.dailyGenerationLimit,
          generationsUsed: existing.generationsUsed,
          windowStartedAt: existing.windowStartedAt,
          status: existing.status,
          videoUrl: existing.videoUrl,
          videoKey: existing.videoKey,
          workerMessage: existing.workerMessage,
          email: existing.email,
        } as const;
      }
    }

    const sessionToken = normalizedToken ?? generateSessionToken();
    const sessionId = await ctx.db.insert("beforeAfterVideoSessions", {
      sessionToken,
      email: args.email?.trim().toLowerCase(),
      beforeKey: undefined,
      afterKey: undefined,
      beforePreviewUrl: undefined,
      afterPreviewUrl: undefined,
      generationsUsed: 0,
      dailyGenerationLimit: limit,
      windowStartedAt: now,
      lastGenerationAt: undefined,
      videoKey: undefined,
      videoUrl: undefined,
      workerMessage: undefined,
      status: "draft",
      lastKnownIpHash: args.ipHash,
      createdAt: now,
      updatedAt: now,
    });

    return {
      sessionId,
      sessionToken,
      dailyGenerationLimit: limit,
      generationsUsed: 0,
      windowStartedAt: now,
      status: "draft" as const,
      videoUrl: null,
      videoKey: null,
    } as const;
  },
});

export const getSession = query({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    return {
      sessionId: session._id,
      sessionToken: session.sessionToken,
      email: session.email,
      beforeKey: session.beforeKey,
      afterKey: session.afterKey,
      beforePreviewUrl: session.beforePreviewUrl,
      afterPreviewUrl: session.afterPreviewUrl,
      generationsUsed: session.generationsUsed,
      dailyGenerationLimit: session.dailyGenerationLimit,
      windowStartedAt: session.windowStartedAt,
      lastGenerationAt: session.lastGenerationAt,
      videoKey: session.videoKey,
      videoUrl: session.videoUrl,
      workerMessage: session.workerMessage,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    } as const;
  },
});

export const setSessionEmail = mutation({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const normalizedEmail = args.email.trim().toLowerCase();
    if (session.email === normalizedEmail) {
      return {
        sessionId: session._id,
        email: session.email,
      } as const;
    }

    await ctx.db.patch(session._id, {
      email: normalizedEmail,
      updatedAt: Date.now(),
    });

    return {
      sessionId: session._id,
      email: normalizedEmail,
    } as const;
  },
});

export const updateSessionUploads = mutation({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
    variant: v.union(v.literal("before"), v.literal("after")),
    fileKey: v.string(),
    previewUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };

    if (args.variant === "before") {
      patch.beforeKey = args.fileKey;
      patch.beforePreviewUrl = args.previewUrl;
    } else {
      patch.afterKey = args.fileKey;
      patch.afterPreviewUrl = args.previewUrl;
    }

    const nextBeforeKey = args.variant === "before" ? args.fileKey : session.beforeKey;
    const nextAfterKey = args.variant === "after" ? args.fileKey : session.afterKey;
    patch.status = nextBeforeKey && nextAfterKey ? "ready" : "draft";

    await ctx.db.patch(session._id, patch);

    return {
      sessionId: session._id,
      status: patch.status as string,
      beforeKey: nextBeforeKey ?? null,
      afterKey: nextAfterKey ?? null,
    } as const;
  },
});

export const clearVideoResult = mutation({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    await ctx.db.patch(args.sessionId, {
      videoKey: undefined,
      videoUrl: undefined,
      workerMessage: undefined,
      status: "draft",
      updatedAt: Date.now(),
    });
  },
});

export const getSessionRecord = query({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const ensureSessionEmail = mutation({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.sessionId);
    if (!record) return null;

    if (record.email) {
      return {
        sessionId: record._id,
        email: record.email,
      } as const;
    }

    const normalizedEmail = args.email.trim().toLowerCase();
    await ctx.db.patch(record._id, {
      email: normalizedEmail,
      updatedAt: Date.now(),
    });

    return {
      sessionId: record._id,
      email: normalizedEmail,
    } as const;
  },
});

export const applyGenerationResult = mutation({
  args: {
    sessionId: v.id("beforeAfterVideoSessions"),
    generationsUsed: v.number(),
    dailyGenerationLimit: v.number(),
    windowStartedAt: v.number(),
    status: v.string(),
    timestamp: v.number(),
    videoUrl: v.optional(v.string()),
    videoKey: v.optional(v.string()),
    workerMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.sessionId);
    if (!record) return null;

    await ctx.db.patch(args.sessionId, {
      generationsUsed: args.generationsUsed,
      dailyGenerationLimit: Math.max(1, args.dailyGenerationLimit),
      windowStartedAt: args.windowStartedAt,
      lastGenerationAt: args.timestamp,
      videoUrl: args.videoUrl ?? undefined,
      videoKey: args.videoKey ?? undefined,
      workerMessage: args.workerMessage ?? undefined,
      status: args.status,
      updatedAt: args.timestamp,
    });

    return {
      sessionId: args.sessionId,
      generationsUsed: args.generationsUsed,
      dailyGenerationLimit: Math.max(1, args.dailyGenerationLimit),
      windowStartedAt: args.windowStartedAt,
      status: args.status,
      videoUrl: args.videoUrl ?? null,
      videoKey: args.videoKey ?? null,
      workerMessage: args.workerMessage ?? null,
    } as const;
  },
});
