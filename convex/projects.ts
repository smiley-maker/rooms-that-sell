import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    listingType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get or create the user record
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      // Create user if they don't exist
      const now = Date.now();
      const trialCredits = 10;
      
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        plan: "trial",
        credits: trialCredits,
        createdAt: now,
        lastActiveAt: now,
      });

      // Create initial credit transaction for trial credits
      await ctx.db.insert("creditTransactions", {
        userId,
        type: "bonus",
        amount: trialCredits,
        description: "Free trial credits",
        createdAt: now,
      });

      user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("Failed to create user");
      }
    }

    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      userId: user._id,
      name: args.name,
      address: args.address,
      listingType: args.listingType,
      status: "active",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Get all projects for the current user
export const getUserProjects = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      // User doesn't exist yet, return empty array
      return [];
    }

    // Get all projects for this user, ordered by most recent first
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Get image counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const imageCount = await ctx.db
          .query("images")
          .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
          .collect()
          .then((images) => images.length);

        const stagedCount = await ctx.db
          .query("images")
          .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
          .filter((q) => q.neq(q.field("stagedUrl"), undefined))
          .collect()
          .then((images) => images.length);

        return {
          ...project,
          imageCount,
          stagedCount,
        };
      })
    );

    return projectsWithCounts;
  },
});

// Get a single project by ID
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const project = await ctx.db.get(args.projectId);
    
    // Ensure the project belongs to the current user
    if (!project || project.userId !== user._id) {
      return null;
    }

    return project;
  },
});

// Update a project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    listingType: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    
    // Ensure the project exists and belongs to the current user
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.address !== undefined) updates.address = args.address;
    if (args.listingType !== undefined) updates.listingType = args.listingType;
    if (args.status !== undefined) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.projectId, updates);
    
    return args.projectId;
  },
});

// Delete a project and all associated images
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    
    // Ensure the project exists and belongs to the current user
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Delete all images associated with this project
    const images = await ctx.db
      .query("images")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const image of images) {
      await ctx.db.delete(image._id);
    }

    // Delete the project
    await ctx.db.delete(args.projectId);
    
    return args.projectId;
  },
});