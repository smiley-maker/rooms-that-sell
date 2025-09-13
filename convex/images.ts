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
    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify project ownership
    const project = await ctx.runQuery(api.projects.getProject, { projectId: args.projectId });
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

      const command = new PutObjectCommand({
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
 * Intelligent room type detection for uploaded images
 */
function detectRoomTypeFromFilename(filename: string): { roomType: string; confidence: number; detectedFeatures: string[] } {
  // Filename parsing patterns for room type detection
  const patterns: Record<string, { patterns: RegExp[]; confidence: number }> = {
    kitchen: {
      patterns: [/kitchen/i, /kit\b/i, /cooking/i, /culinary/i],
      confidence: 0.9
    },
    living_room: {
      patterns: [/living[\s_-]?room/i, /living/i, /lounge/i, /sitting[\s_-]?room/i, /great[\s_-]?room/i, /lr\b/i],
      confidence: 0.85
    },
    bedroom: {
      patterns: [/bedroom/i, /bed[\s_-]?room/i, /br\d*/i, /sleeping/i, /\bbr\b/i],
      confidence: 0.85
    },
    master_bedroom: {
      patterns: [/master[\s_-]?bedroom/i, /master[\s_-]?bed/i, /master[\s_-]?br/i, /mbr/i, /primary[\s_-]?bedroom/i],
      confidence: 0.95
    },
    bathroom: {
      patterns: [/bathroom/i, /bath[\s_-]?room/i, /\bbath\b/i, /\bba\b/i, /washroom/i, /restroom/i],
      confidence: 0.9
    },
    dining_room: {
      patterns: [/dining[\s_-]?room/i, /dining/i, /\bdr\b/i, /breakfast[\s_-]?nook/i],
      confidence: 0.85
    },
    office: {
      patterns: [/office/i, /study/i, /den/i, /library/i, /work[\s_-]?room/i, /home[\s_-]?office/i],
      confidence: 0.8
    },
    family_room: {
      patterns: [/family[\s_-]?room/i, /family/i, /rec[\s_-]?room/i, /recreation/i, /game[\s_-]?room/i],
      confidence: 0.8
    },
    basement: {
      patterns: [/basement/i, /cellar/i, /lower[\s_-]?level/i, /downstairs/i],
      confidence: 0.9
    },
    garage: {
      patterns: [/garage/i, /car[\s_-]?port/i, /parking/i],
      confidence: 0.95
    },
    laundry_room: {
      patterns: [/laundry/i, /wash[\s_-]?room/i, /utility[\s_-]?room/i, /mud[\s_-]?room/i],
      confidence: 0.9
    },
    guest_room: {
      patterns: [/guest[\s_-]?room/i, /guest[\s_-]?bed/i, /spare[\s_-]?room/i, /spare[\s_-]?bed/i],
      confidence: 0.85
    },
    walk_in_closet: {
      patterns: [/walk[\s_-]?in[\s_-]?closet/i, /closet/i, /wardrobe/i, /dressing[\s_-]?room/i],
      confidence: 0.8
    },
    foyer: {
      patterns: [/foyer/i, /entry[\s_-]?way/i, /entrance/i, /front[\s_-]?hall/i, /vestibule/i],
      confidence: 0.85
    },
    pantry: {
      patterns: [/pantry/i, /storage/i, /food[\s_-]?storage/i],
      confidence: 0.8
    },
    powder_room: {
      patterns: [/powder[\s_-]?room/i, /half[\s_-]?bath/i, /guest[\s_-]?bath/i],
      confidence: 0.9
    },
    balcony: {
      patterns: [/balcony/i, /patio/i, /deck/i, /terrace/i, /outdoor/i, /veranda/i],
      confidence: 0.85
    }
  };

  // Clean filename for better matching
  const cleanFilename = filename
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, '') // Remove extension
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\d+/g, '') // Remove numbers for better pattern matching
    .trim();

  let bestMatch: { roomType: string; confidence: number } | null = null;
  const detectedFeatures: string[] = [];

  // Test each room type pattern
  for (const [roomType, patternConfig] of Object.entries(patterns)) {
    const { patterns: roomPatterns, confidence } = patternConfig;
    for (const pattern of roomPatterns) {
      if (pattern.test(cleanFilename)) {
        detectedFeatures.push(`filename_pattern_${roomType}`);
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { roomType, confidence };
        }
        break; // Only match first pattern per room type
      }
    }
  }

  // Structural feature detection from filename
  const structuralFeatures: Record<string, { keywords: string[]; roomTypes: string[]; weight: number }> = {
    cabinets: { keywords: ["cabinet", "cupboard"], roomTypes: ["kitchen", "laundry_room"], weight: 0.8 },
    countertop: { keywords: ["counter", "granite", "marble", "quartz"], roomTypes: ["kitchen", "bathroom"], weight: 0.7 },
    appliances: { keywords: ["stove", "oven", "refrigerator", "dishwasher"], roomTypes: ["kitchen"], weight: 0.9 },
    toilet: { keywords: ["toilet", "commode"], roomTypes: ["bathroom", "powder_room"], weight: 0.95 },
    shower: { keywords: ["shower", "tub", "bathtub"], roomTypes: ["bathroom"], weight: 0.9 },
    bed: { keywords: ["bed", "mattress"], roomTypes: ["bedroom", "master_bedroom", "guest_room"], weight: 0.8 },
    fireplace: { keywords: ["fireplace", "mantle"], roomTypes: ["living_room", "family_room"], weight: 0.7 },
    desk: { keywords: ["desk", "computer"], roomTypes: ["office"], weight: 0.8 },
    washer: { keywords: ["washer", "dryer"], roomTypes: ["laundry_room"], weight: 0.95 }
  };

  // Analyze structural features
  const roomTypeScores: Record<string, number> = {};
  for (const [featureName, { keywords, roomTypes, weight }] of Object.entries(structuralFeatures)) {
    const featureDetected = keywords.some(keyword => cleanFilename.includes(keyword));
    
    if (featureDetected) {
      detectedFeatures.push(featureName);
      for (const roomType of roomTypes) {
        roomTypeScores[roomType] = (roomTypeScores[roomType] || 0) + weight;
      }
    }
  }

  // If structural analysis gives a better result, use it
  for (const [roomType, score] of Object.entries(roomTypeScores)) {
    const confidence = Math.min(score / 2, 0.8); // Cap at 0.8 for structural analysis
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { roomType, confidence };
    }
  }

  return {
    roomType: bestMatch?.roomType || "unknown",
    confidence: bestMatch?.confidence || 0,
    detectedFeatures
  };
}

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

    // Intelligent room type detection
    const detectionResult = detectRoomTypeFromFilename(args.filename);
    const finalRoomType = args.roomType || detectionResult.roomType;

    // Create image record
    const imageId = await ctx.db.insert("images", {
      projectId: args.projectId,
      userId: user._id,
      originalUrl,
      imageKey: args.imageKey,
      roomType: finalRoomType,
      filename: args.filename,
      fileSize: args.fileSize,
      dimensions: args.dimensions,
      status: "uploaded",
      metadata: {
        detectedFeatures: detectionResult.detectedFeatures,
        confidence: detectionResult.confidence,
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

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Get image record
    const image = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
    if (!image) {
      throw new Error("Image not found");
    }

    // Debug logging for problematic images (can be removed in production)
    // console.log(`Getting download URL for image ${args.imageId}: isStaged=${args.isStaged}, imageKey=${!!image.imageKey}, stagedKey=${!!image.stagedKey}, stagedUrl=${image.stagedUrl?.substring(0, 50)}...`);

    // Verify ownership through project
    const project = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Check if we're requesting a staged image and it's a data URL (AI generated)
    if (args.isStaged && image.stagedUrl && image.stagedUrl.startsWith('data:')) {
      // Return the data URL directly for AI-generated images
      console.log(`Returning data URL for AI-generated staged image ${args.imageId}`);
      return image.stagedUrl;
    }

    // Determine which key and bucket to use for R2 storage
    let key: string;
    let bucket: string;
    
    if (args.isStaged && image.stagedKey && image.stagedUrl && image.stagedUrl.includes('r2.cloudflarestorage.com')) {
      // Use staged image if it's a real R2 URL
      key = image.stagedKey;
      bucket = process.env.R2_BUCKET_STYLIZED!;
    } else if (args.isStaged && image.stagedUrl && !image.stagedUrl.includes('r2.cloudflarestorage.com') && !image.stagedUrl.startsWith('data:')) {
      // If staged URL is a mock URL (not data URL), fall back to original image
      // console.log(`Staged image is mock URL, falling back to original for image ${args.imageId}`);
      if (!image.imageKey) {
        // If no imageKey, try to extract from originalUrl
        // console.log(`No imageKey available, trying to extract from originalUrl for image ${args.imageId}`);
        const url = image.originalUrl;
        if (!url || !url.includes('r2.cloudflarestorage.com')) {
          throw new Error(`No imageKey and invalid originalUrl for fallback for image ${args.imageId}: ${url}`);
        }
        const urlParts = url.split('/');
        if (urlParts.length < 5) {
          throw new Error(`Invalid R2 URL format for fallback: ${url}`);
        }
        bucket = urlParts[3]; // bucket name from URL
        key = urlParts.slice(4).join('/'); // Everything after bucket
      } else {
        key = image.imageKey;
        bucket = process.env.R2_BUCKET_OG!;
      }
    } else if (image.imageKey) {
      key = image.imageKey;
      bucket = process.env.R2_BUCKET_OG!;
    } else {
      // Fallback: extract key from URL for older records
      const url = image.originalUrl; // Always use original URL for fallback
      if (!url || !url.includes('r2.cloudflarestorage.com')) {
        throw new Error(`Invalid image URL for fallback: ${url}`);
      }
      const urlParts = url.split('/');
      if (urlParts.length < 5) {
        throw new Error(`Invalid R2 URL format: ${url}`);
      }
      bucket = urlParts[3]; // bucket name from URL
      key = urlParts.slice(4).join('/'); // Everything after bucket
    }

    // Validate that we have both bucket and key
    if (!bucket) {
      throw new Error(`No bucket determined for image ${args.imageId}`);
    }
    if (!key) {
      throw new Error(`No key determined for image ${args.imageId}. ImageKey: ${image.imageKey}, OriginalUrl: ${image.originalUrl}`);
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

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(r2Client, command, { 
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
 * Get room type suggestions for an image
 */
export const getRoomTypeSuggestions = query({
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

    // Re-run detection on the filename to get fresh suggestions
    const detectionResult = detectRoomTypeFromFilename(image.filename);
    
    // Get fallback suggestions for common room types
    const fallbackSuggestions = [
      { roomType: "living_room", confidence: 0.3, reason: "Most common room in listings" },
      { roomType: "bedroom", confidence: 0.3, reason: "Common room type" },
      { roomType: "kitchen", confidence: 0.3, reason: "Essential room in every home" },
      { roomType: "bathroom", confidence: 0.3, reason: "Essential room in every home" },
      { roomType: "dining_room", confidence: 0.3, reason: "Common in residential properties" }
    ];

    return {
      currentRoomType: image.roomType,
      detectedRoomType: detectionResult.roomType,
      confidence: detectionResult.confidence,
      detectedFeatures: detectionResult.detectedFeatures,
      suggestions: detectionResult.confidence > 0.3 ? [
        { roomType: detectionResult.roomType, confidence: detectionResult.confidence, reason: "Detected from filename" }
      ] : fallbackSuggestions,
      filename: image.filename
    };
  },
});

/**
 * Update image status
 */
export const updateImageStatus = mutation({
  args: {
    imageId: v.id("images"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update image with staged result
 */
export const updateImageWithStagedResult = mutation({
  args: {
    imageId: v.id("images"),
    stagedUrl: v.string(),
    stagedKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      stagedUrl: args.stagedUrl,
      stagedKey: args.stagedKey,
      status: "staged",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update image metadata
 */
export const updateImageMetadata = mutation({
  args: {
    imageId: v.id("images"),
    metadata: v.object({
      detectedFeatures: v.optional(v.array(v.string())),
      confidence: v.optional(v.number()),
      processingTime: v.optional(v.number()),
      stylePreset: v.optional(v.string()),
      aiModel: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      metadata: args.metadata,
      updatedAt: Date.now(),
    });
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