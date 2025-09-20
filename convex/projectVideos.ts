import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const serialize = (video: Doc<"projectVideos">): ProjectVideoSummary => ({
  _id: video._id,
  projectId: video.projectId,
  userId: video.userId,
  imageId: video.imageId,
  versionId: video.versionId ?? null,
  videoKey: video.videoKey ?? null,
  videoUrl: video.videoUrl ?? null,
  status: video.status,
  message: video.message ?? null,
  createdAt: video.createdAt,
  updatedAt: video.updatedAt,
});

export type ProjectVideoSummary = {
  _id: Id<"projectVideos">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  imageId: Id<"images">;
  versionId: Id<"imageVersions"> | null;
  videoKey: string | null;
  videoUrl: string | null;
  status: string;
  message: string | null;
  createdAt: number;
  updatedAt: number;
};

export const getVideoForImage = query({
  args: {
    imageId: v.id("images"),
    versionId: v.optional(v.id("imageVersions")),
  },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("projectVideos")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    if (videos.length === 0) return null;

    const sorted = videos.sort((a, b) => b.updatedAt - a.updatedAt);

    if (args.versionId) {
      const exact = sorted.find((video) => video.versionId && video.versionId === args.versionId);
      if (exact) return serialize(exact);
    }

    const fallback = sorted.find((video) => !video.versionId) ?? sorted[0];
    return serialize(fallback);
  },
});

export const listVideosForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("projectVideos")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return videos.map(serialize);
  },
});

export const listVideosByImage = query({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    const videos = await ctx.db
      .query("projectVideos")
      .withIndex("by_image", (q) => q.eq("imageId", args.imageId))
      .collect();

    return videos.map(serialize);
  },
});

export const ensureProcessingVideo = mutation({
  args: {
    videoId: v.optional(v.id("projectVideos")),
    projectId: v.id("projects"),
    userId: v.id("users"),
    imageId: v.id("images"),
    versionId: v.optional(v.id("imageVersions")),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"projectVideos">> => {
    if (args.videoId) {
      await ctx.db.patch(args.videoId, {
        status: "processing",
        videoKey: undefined,
        videoUrl: undefined,
        message: undefined,
        updatedAt: args.timestamp,
      });
      return args.videoId;
    }

    return await ctx.db.insert("projectVideos", {
      projectId: args.projectId,
      userId: args.userId,
      imageId: args.imageId,
      versionId: args.versionId ?? undefined,
      status: "processing",
      createdAt: args.timestamp,
      updatedAt: args.timestamp,
    });
  },
});

export const saveWorkerResponse = mutation({
  args: {
    videoId: v.id("projectVideos"),
    status: v.string(),
    timestamp: v.number(),
    videoKey: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ProjectVideoSummary | null> => {
    await ctx.db.patch(args.videoId, {
      status: args.status,
      updatedAt: args.timestamp,
      videoKey: args.videoKey ?? undefined,
      videoUrl: args.videoUrl ?? undefined,
      message: args.message ?? undefined,
    });

    const updated = await ctx.db.get(args.videoId);
    return updated ? serialize(updated) : null;
  },
});
