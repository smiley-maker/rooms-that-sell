import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

interface MLSDownloadPayload {
  success: true;
  projectName: string;
  downloads: Array<{
    imageId: Id<"images">;
    baseName: string;
    originalUrl: string;
    stagedUrl: string;
  }>;
}

export const createMLSExport = action({
  args: {
    projectId: v.id("projects"),
    imageIds: v.array(v.id("images")),
  },
  handler: async (ctx, args): Promise<MLSDownloadPayload> => {
    if (args.imageIds.length === 0) {
      throw new Error("Select at least one image to export");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.runQuery(api.projects.getProject, { projectId: args.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    const images = await Promise.all(
      args.imageIds.map(async (imageId) => {
        const image = await ctx.runQuery(api.images.getImageById, { imageId });
        if (!image || image.projectId !== project._id) {
          throw new Error("Image not found or access denied");
        }
        if (!image.stagedUrl) {
          throw new Error(`Image ${image.filename} has not been staged yet`);
        }
        return image;
      })
    );

    const downloads: MLSDownloadPayload["downloads"] = [];

    for (const image of images) {
      const originalUrl = await ctx.runAction(api.images.getImageDownloadUrl, {
        imageId: image._id,
      });

      const stagedUrl = await ctx.runAction(api.images.getImageDownloadUrl, {
        imageId: image._id,
        isStaged: true,
      });

      downloads.push({
        imageId: image._id,
        baseName: sanitiseBaseName(image.filename),
        originalUrl,
        stagedUrl,
      });
    }

    return {
      success: true,
      projectName: project.name || "mls-export",
      downloads,
    };
  },
});

function sanitiseBaseName(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}
