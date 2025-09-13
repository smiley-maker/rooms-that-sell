import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Validate file type for image uploads
 */
function validateImageFile(filename: string, contentType: string): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const extension = filename.toLowerCase().split('.').pop();
  
  if (!allowedTypes.includes(contentType)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' };
  }
  
  if (!extension || !allowedExtensions.includes(`.${extension}`)) {
    return { valid: false, error: 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed.' };
  }
  
  return { valid: true };
}

/**
 * Generate a unique key for storing images in R2
 */
function generateImageKey(userId: string, projectId: string, filename: string, isStaged = false): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove extension
  const suffix = isStaged ? '_staged' : '';
  
  return `users/${userId}/projects/${projectId}/${timestamp}_${baseName}${suffix}.${extension}`;
}

/**
 * Generate a pre-signed URL for image upload using Convex action
 */
export const generateImageUploadUrl = action({
  args: {
    projectId: v.id("projects"),
    filename: v.string(),
    contentType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args): Promise<{
    uploadUrl: string;
    imageKey: string;
    bucket: string;
  }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user: any = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify project ownership
    const project: any = await ctx.runQuery(api.projects.getProject, { projectId: args.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Validate file
    const validation = validateImageFile(args.filename, args.contentType);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (args.fileSize > maxSize) {
      throw new Error("File size exceeds 10MB limit");
    }

    // Generate unique key for R2 storage
    const imageKey = generateImageKey(user._id, args.projectId, args.filename);

    try {
      // Check if environment variables are available
      if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_OG) {
        throw new Error("Missing required R2 environment variables");
      }

      // Use AWS SDK to generate pre-signed URL
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const command: any = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_OG!,
        Key: imageKey,
        ContentType: args.contentType,
        Metadata: {
          userId: user._id,
          projectId: args.projectId,
          originalFilename: args.filename,
        },
      });

      const uploadUrl: string = await getSignedUrl(r2Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      return {
        uploadUrl,
        imageKey,
        bucket: process.env.R2_BUCKET_OG!,
      };
    } catch (error) {
      console.error("Failed to generate upload URL:", error);
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Create image record after successful upload to R2
 */
export const createImageRecord = mutation({
  args: {
    projectId: v.id("projects"),
    imageKey: v.string(),
    filename: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    dimensions: v.object({
      width: v.number(),
      height: v.number(),
    }),
    roomType: v.optional(v.string()),
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

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Generate the R2 URL for the uploaded image
    const originalUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_OG}/${args.imageKey}`;

    // Create image record
    const imageId = await ctx.db.insert("images", {
      projectId: args.projectId,
      userId: user._id,
      originalUrl,
      imageKey: args.imageKey,
      roomType: args.roomType || "unknown",
      filename: args.filename,
      fileSize: args.fileSize,
      dimensions: args.dimensions,
      status: "uploaded",
      metadata: {
        detectedFeatures: [],
        confidence: undefined,
        processingTime: undefined,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return imageId;
  },
});

/**
 * Get images for a project
 */
export const getProjectImages = query({
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

    // Verify project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Get all images for the project
    const images = await ctx.db
      .query("images")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    return images;
  },
});

/**
 * Generate download URL for an image
 */
export const getImageDownloadUrl = action({
  args: {
    imageId: v.id("images"),
    isStaged: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<string> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user: any = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Get image record
    const image: any = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership through project
    const project: any = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Determine which key and bucket to use
    let key: string;
    let bucket: string;
    
    if (args.isStaged && image.stagedKey) {
      key = image.stagedKey;
      bucket = process.env.R2_BUCKET_STYLIZED!;
    } else if (image.imageKey) {
      key = image.imageKey;
      bucket = process.env.R2_BUCKET_OG!;
    } else {
      // Fallback: extract key from URL for older records
      const url: string = args.isStaged && image.stagedUrl ? image.stagedUrl : image.originalUrl;
      const urlParts: string[] = url.split('/');
      bucket = urlParts[3]; // bucket name from URL
      key = urlParts.slice(4).join('/'); // Everything after bucket
    }

    try {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      const command: any = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const downloadUrl: string = await getSignedUrl(r2Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      return downloadUrl;
    } catch (error) {
      console.error("Failed to generate download URL:", error);
      throw new Error("Failed to generate download URL");
    }
  },
});

/**
 * Get image by ID (helper query)
 */
export const getImageById = query({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.imageId);
  },
});

/**
 * Update image room type
 */
export const updateImageRoomType = mutation({
  args: {
    imageId: v.id("images"),
    roomType: v.string(),
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

    // Get image and verify ownership
    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== user._id) {
      throw new Error("Image not found or access denied");
    }

    // Update room type
    await ctx.db.patch(args.imageId, {
      roomType: args.roomType,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete image
 */
export const deleteImage = mutation({
  args: {
    imageId: v.id("images"),
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

    // Get image and verify ownership
    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== user._id) {
      throw new Error("Image not found or access denied");
    }

    // Delete image record
    await ctx.db.delete(args.imageId);

    // TODO: In a production system, you might want to also delete the actual files from R2
    // This would require additional R2 delete operations

    return { success: true };
  },
});