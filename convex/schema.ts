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
});


