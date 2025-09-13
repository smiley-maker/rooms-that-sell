import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug query to check image statuses in the database
 */
export const debugImageStatuses = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all images for the project
    const images = await ctx.db
      .query("images")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Return debug info
    return {
      totalImages: images.length,
      imagesByStatus: images.reduce((acc, img) => {
        acc[img.status] = (acc[img.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      imageDetails: images.map(img => ({
        id: img._id,
        filename: img.filename,
        status: img.status,
        roomType: img.roomType,
        createdAt: new Date(img.createdAt).toISOString(),
      })),
    };
  },
});

/**
 * Debug query to get all projects for current user
 */
export const debugUserProjects = query({
  args: {},
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all projects for the user
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    return {
      userId: user._id,
      userEmail: user.email,
      totalProjects: projects.length,
      projects: projects.map(p => ({
        id: p._id,
        name: p.name,
        status: p.status,
        createdAt: new Date(p.createdAt).toISOString(),
      })),
    };
  },
});