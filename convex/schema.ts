import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    listingsPerMonth: v.string(),
    createdAt: v.number(),
    source: v.string(),
  })
    .index("by_email", ["email"]) // for idempotency, prevent dup joins
    .index("by_createdAt", ["createdAt"]),

  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    plan: v.string(), // "trial", "agent", "pro", "business"
    credits: v.number(),
    stripeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    address: v.string(),
    listingType: v.string(), // "sale", "rent", "staging"
    status: v.string(), // "active", "completed", "archived"
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  images: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    originalUrl: v.string(), // Cloudflare R2 URL for the stored image
    stagedUrl: v.optional(v.string()), // Cloudflare R2 URL for the staged version
    imageKey: v.optional(v.string()), // R2 storage key for the original image
    stagedKey: v.optional(v.string()), // R2 storage key for the staged version
    roomType: v.string(),
    filename: v.string(), // Original filename from user upload
    fileSize: v.number(),
    dimensions: v.object({
      width: v.number(),
      height: v.number(),
    }),
    status: v.string(), // "uploaded", "processing", "staged", "approved", "exported"
    metadata: v.object({
      detectedFeatures: v.optional(v.array(v.string())),
      confidence: v.optional(v.number()),
      processingTime: v.optional(v.number()),
      stylePreset: v.optional(v.string()),
      aiModel: v.optional(v.string()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  stagingJobs: defineTable({
    userId: v.id("users"),
    imageIds: v.array(v.id("images")),
    stylePreset: v.string(),
    customPrompt: v.optional(v.string()),
    status: v.string(), // "queued", "processing", "completed", "failed"
    results: v.optional(v.array(v.object({
      imageId: v.id("images"),
      stagedUrl: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    }))),
    creditsUsed: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSubscriptionId", ["stripeSubscriptionId"]),

  creditTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "purchase", "usage", "refund", "bonus"
    amount: v.number(), // positive for additions, negative for usage
    description: v.string(),
    relatedJobId: v.optional(v.id("stagingJobs")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_type", ["type"]),
});


