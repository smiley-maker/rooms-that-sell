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
    currentVersionId: v.optional(v.id("imageVersions")),
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
    mlsCompliance: v.optional(v.object({
      isCompliant: v.boolean(),
      score: v.number(),
      violations: v.array(v.string()),
      warnings: v.array(v.string()),
      lastChecked: v.number(),
      structuralPreservation: v.object({
        validated: v.boolean(),
        confidence: v.number(),
        issues: v.array(v.string()),
      }),
      watermarkApplied: v.boolean(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_compliance", ["mlsCompliance.isCompliant"]),

  imageVersions: defineTable({
    imageId: v.id("images"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    stagedUrl: v.string(),
    stagedKey: v.string(),
    stylePreset: v.string(),
    customPrompt: v.optional(v.string()),
    seed: v.number(),
    aiModel: v.string(),
    processingTime: v.number(),
    pinned: v.boolean(),
    mlsCompliance: v.optional(v.object({
      isCompliant: v.boolean(),
      score: v.number(),
      violations: v.array(v.string()),
      warnings: v.array(v.string()),
      lastChecked: v.number(),
      structuralPreservation: v.object({
        validated: v.boolean(),
        confidence: v.number(),
        issues: v.array(v.string()),
      }),
      watermarkApplied: v.boolean(),
    })),
    createdAt: v.number(),
  })
    .index("by_imageId", ["imageId"]) 
    .index("by_projectId", ["projectId"]) 
    .index("by_userId", ["userId"]) 
    .index("by_createdAt", ["createdAt"]) 
    .index("by_pinned", ["pinned"]),

  stagingJobs: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
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
    updatedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"]) 
    .index("by_status", ["status"]) 
    .index("by_projectId", ["projectId"]),

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

  mlsExports: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    imageIds: v.array(v.id("images")),
    exportType: v.string(), // "original", "staged", "both"
    resolutions: v.array(v.string()),
    watermarkSettings: v.object({
      text: v.string(),
      position: v.string(),
      opacity: v.number(),
      fontSize: v.number(),
      color: v.string(),
    }),
    complianceValidated: v.boolean(),
    exportUrls: v.array(v.object({
      type: v.string(), // "original" | "staged"
      resolution: v.string(),
      url: v.string(),
      filename: v.string(),
    })),
    status: v.string(), // "processing", "completed", "failed"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"])
    .index("by_status", ["status"]),

  toolUsage: defineTable({
    toolSlug: v.string(),
    ipHash: v.string(),
    count: v.number(),
    windowStartedAt: v.number(),
    lastUsedAt: v.number(),
  }).index("by_tool_ip", ["toolSlug", "ipHash"]),
});

