import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  applyWatermark,
  DEFAULT_WATERMARK,
  MLS_EXPORT_RESOLUTIONS,
  getMLSComplianceGuidelines,
  type WatermarkOptions,
} from "./lib/mlsCompliance";

/**
 * Validate MLS compliance for a staged image
 */
export const validateImageCompliance = action({
  args: {
    imageId: v.id("images"),
  },
  handler: async (ctx, args) => {
    // Allow background invocation without identity; when identity exists, enforce ownership
    const identity = await ctx.auth.getUserIdentity();
    const user = identity ? await ctx.runQuery(api.users.getCurrentUser) : null;

    // Get image and verify ownership
    const image = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership through project when a user identity is present
    const project = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
    if (!project) {
      throw new Error("Project not found");
    }
    if (user && project.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Check if image has been staged
    if (!image.stagedUrl || image.status !== "staged") {
      throw new Error("Image must be staged before compliance validation");
    }

    try {
      // For now, provide a mock compliance result to test the UI
      // TODO: Replace with actual AI validation once debugging is complete
      const complianceResult = {
        isCompliant: true,
        score: 85,
        violations: [],
        warnings: ['Minor lighting adjustment recommended'],
        recommendations: ['Consider adjusting furniture placement'],
      };

      const structuralValidation = {
        isCompliant: true,
        violations: [],
        warnings: [],
        confidence: 0.9,
      };

      // Update image with compliance data
      await ctx.runMutation(api.mlsCompliance.updateImageCompliance, {
        imageId: args.imageId,
        complianceData: {
          isCompliant: complianceResult.isCompliant,
          score: complianceResult.score,
          violations: complianceResult.violations,
          warnings: complianceResult.warnings,
          lastChecked: Date.now(),
          structuralPreservation: {
            validated: true,
            confidence: structuralValidation.confidence,
            issues: structuralValidation.violations,
          },
          watermarkApplied: image.stagedUrl.includes('Virtually Staged') || false,
        },
      });

      return {
        success: true,
        compliance: complianceResult,
        structural: structuralValidation,
      };

    } catch (error) {
      console.error("Compliance validation failed:", error);
      throw new Error(`Compliance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Update image compliance data
 */
export const updateImageCompliance = mutation({
  args: {
    imageId: v.id("images"),
    complianceData: v.object({
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
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      mlsCompliance: args.complianceData,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Apply watermark to a staged image
 */
export const applyImageWatermark = action({
  args: {
    imageId: v.id("images"),
    watermarkOptions: v.optional(v.object({
      text: v.string(),
      position: v.string(),
      opacity: v.number(),
      fontSize: v.number(),
      color: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Get image and verify ownership
    const image = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership through project
    const project = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Access denied");
    }

    if (!image.stagedUrl) {
      throw new Error("No staged image to watermark");
    }

    try {
      // Use provided options or defaults
      const watermarkOptions: WatermarkOptions = {
        text: args.watermarkOptions?.text || DEFAULT_WATERMARK.text,
        position: (args.watermarkOptions?.position as WatermarkOptions['position']) || DEFAULT_WATERMARK.position,
        opacity: args.watermarkOptions?.opacity || DEFAULT_WATERMARK.opacity,
        fontSize: args.watermarkOptions?.fontSize || DEFAULT_WATERMARK.fontSize,
        color: args.watermarkOptions?.color || DEFAULT_WATERMARK.color,
      };

      // Apply watermark to the staged image
      const watermarkedImageUrl = await applyWatermark(image.stagedUrl, watermarkOptions);

      // Update the image with watermarked version
      await ctx.runMutation(api.images.updateImageWithStagedResult, {
        imageId: args.imageId,
        stagedUrl: watermarkedImageUrl,
        stagedKey: image.stagedKey || `staged/${args.imageId}_watermarked.jpg`,
      });

      // Update compliance status
      if (image.mlsCompliance) {
        await ctx.runMutation(api.mlsCompliance.updateImageCompliance, {
          imageId: args.imageId,
          complianceData: {
            ...image.mlsCompliance,
            watermarkApplied: true,
            lastChecked: Date.now(),
          },
        });
      }

      return {
        success: true,
        watermarkedUrl: watermarkedImageUrl,
      };

    } catch (error) {
      console.error("Watermark application failed:", error);
      throw new Error(`Failed to apply watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Generate export files with multiple resolutions
 */
export const generateExportFiles = action({
  args: {
    imageId: v.id("images"),
    resolutions: v.array(v.string()),
    includeOriginal: v.boolean(),
    includeStaged: v.boolean(),
    watermarkOptions: v.optional(v.object({
      text: v.string(),
      position: v.string(),
      opacity: v.number(),
      fontSize: v.number(),
      color: v.string(),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    exports: Array<{
      type: 'original' | 'staged';
      resolution: string;
      dataUrl: string;
      filename: string;
    }>;
    error?: string;
  }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Get image and verify ownership
    const image = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership through project
    const project = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Access denied");
    }

    try {
      // Map resolution names to actual dimensions
      const resolutionMap = MLS_EXPORT_RESOLUTIONS.reduce((acc, res) => {
        acc[res.name] = res;
        return acc;
      }, {} as Record<string, typeof MLS_EXPORT_RESOLUTIONS[0]>);

      const selectedResolutions = args.resolutions
        .map(name => resolutionMap[name])
        .filter(Boolean);

      if (selectedResolutions.length === 0) {
        throw new Error("No valid resolutions selected");
      }

      const exports = [];

      // Process original image if requested
      if (args.includeOriginal && image.originalUrl) {
        for (const resolution of selectedResolutions) {
          try {
            // For now, return the original URL as-is (in production, this would be resized)
            const originalUrl = await ctx.runAction(api.images.getImageDownloadUrl, {
              imageId: args.imageId,
              isStaged: false
            });

            exports.push({
              type: 'original' as const,
              resolution: resolution.name,
              dataUrl: originalUrl,
              filename: `original_${resolution.name.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`,
            });
          } catch (error) {
            console.error(`Failed to process original image for ${resolution.name}:`, error);
          }
        }
      }

      // Process staged image if requested
      if (args.includeStaged && image.stagedUrl) {
        for (const resolution of selectedResolutions) {
          try {
            // Get staged image URL
            const stagedUrl = await ctx.runAction(api.images.getImageDownloadUrl, {
              imageId: args.imageId,
              isStaged: true
            });

            // Apply watermark if needed and if it's a data URL
            let finalUrl = stagedUrl;
            if (stagedUrl.startsWith('data:') && args.watermarkOptions) {
              const watermarkOptions: WatermarkOptions = {
                text: args.watermarkOptions.text || DEFAULT_WATERMARK.text,
                position: (args.watermarkOptions.position as WatermarkOptions['position']) || DEFAULT_WATERMARK.position,
                opacity: args.watermarkOptions.opacity || DEFAULT_WATERMARK.opacity,
                fontSize: args.watermarkOptions.fontSize || DEFAULT_WATERMARK.fontSize,
                color: args.watermarkOptions.color || DEFAULT_WATERMARK.color,
              };

              finalUrl = await applyWatermark(stagedUrl, watermarkOptions);
            }

            exports.push({
              type: 'staged' as const,
              resolution: resolution.name,
              dataUrl: finalUrl,
              filename: `staged_${resolution.name.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`,
            });
          } catch (error) {
            console.error(`Failed to process staged image for ${resolution.name}:`, error);
          }
        }
      }

      return {
        success: true,
        exports,
      };

    } catch (error) {
      console.error('Export file generation failed:', error);
      return {
        success: false,
        exports: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

/**
 * Create MLS export package for images
 */
export const createMLSExport = action({
  args: {
    projectId: v.id("projects"),
    imageIds: v.array(v.id("images")),
    exportOptions: v.object({
      includeOriginal: v.boolean(),
      includeStaged: v.boolean(),
      resolutions: v.array(v.string()),
      watermarkOptions: v.optional(v.object({
        text: v.string(),
        position: v.string(),
        opacity: v.number(),
        fontSize: v.number(),
        color: v.string(),
      })),
    }),
  },
  handler: async (ctx, args): Promise<{ success: boolean; message?: string; exportId?: string; exports?: Array<{ type: string; filename: string; resolution: string; url: string }>; complianceValidated?: boolean; complianceIssues?: Array<{ type: string; message: string }>; totalFiles?: number }> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify project ownership
    const project = await ctx.runQuery(api.projects.getProject, { projectId: args.projectId });
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found or access denied");
    }

    // Verify all images belong to the project and user
    const images = await Promise.all(
      args.imageIds.map(async (imageId) => {
        const image = await ctx.runQuery(api.images.getImageById, { imageId });
        if (!image || image.projectId !== args.projectId || image.userId !== user._id) {
          throw new Error(`Image ${imageId} not found or access denied`);
        }
        return image;
      })
    );

    // Create export record
    const exportId = await ctx.runMutation(api.mlsCompliance.createExportRecord, {
      projectId: args.projectId,
      imageIds: args.imageIds,
      exportOptions: args.exportOptions,
    });

    try {
      // Validate compliance for all staged images
      let allCompliant = true;
      const complianceIssues: string[] = [];

      for (const image of images) {
        if (image.stagedUrl && args.exportOptions.includeStaged) {
          // Check if compliance validation exists and is recent (within 24 hours)
          const needsValidation = !image.mlsCompliance || 
            (Date.now() - image.mlsCompliance.lastChecked) > 24 * 60 * 60 * 1000;

          if (needsValidation) {
            try {
              // Mock compliance validation for now
              const complianceResult = {
                isCompliant: true,
                score: 85,
                violations: [],
                warnings: ['Minor lighting adjustment recommended'],
              };

              const structuralValidation = {
                confidence: 0.9,
                violations: [],
              };

              // Update image with compliance data
              await ctx.runMutation(api.mlsCompliance.updateImageCompliance, {
                imageId: image._id,
                complianceData: {
                  isCompliant: complianceResult.isCompliant,
                  score: complianceResult.score,
                  violations: complianceResult.violations,
                  warnings: complianceResult.warnings,
                  lastChecked: Date.now(),
                  structuralPreservation: {
                    validated: true,
                    confidence: structuralValidation.confidence,
                    issues: structuralValidation.violations,
                  },
                  watermarkApplied: image.stagedUrl.includes('Virtually Staged') || false,
                },
              });

              if (!complianceResult.isCompliant) {
                allCompliant = false;
                complianceIssues.push(`${image.filename}: ${complianceResult.violations.join(', ')}`);
              }
            } catch {
              allCompliant = false;
              complianceIssues.push(`${image.filename}: Validation failed`);
            }
          } else if (image.mlsCompliance && !image.mlsCompliance.isCompliant) {
            allCompliant = false;
            complianceIssues.push(`${image.filename}: ${image.mlsCompliance.violations.join(', ')}`);
          }
        }
      }

      // Map resolution names to actual dimensions
      const resolutionMap = MLS_EXPORT_RESOLUTIONS.reduce((acc, res) => {
        acc[res.name] = res;
        return acc;
      }, {} as Record<string, typeof MLS_EXPORT_RESOLUTIONS[0]>);

      const selectedResolutions = args.exportOptions.resolutions
        .map(name => resolutionMap[name])
        .filter(Boolean);

      if (selectedResolutions.length === 0) {
        throw new Error("No valid resolutions selected");
      }

      // Generate export package for each image
      const allExports: Array<{
        imageId: Id<"images">;
        exports: Array<{
          type: 'original' | 'staged';
          resolution: string;
          dataUrl: string;
          filename: string;
        }>;
      }> = [];

      // Generate mock exports for now (replace with actual export generation later)
      for (const image of images) {
        const mockExports = [];
        
        // Generate mock exports for each resolution
        for (const resolution of selectedResolutions) {
          if (args.exportOptions.includeOriginal) {
            mockExports.push({
              type: 'original' as const,
              resolution: resolution.name,
              dataUrl: `data:image/jpeg;base64,mock-original-${image._id}-${resolution.name}`,
              filename: `original_${resolution.name.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`,
            });
          }
          
          if (args.exportOptions.includeStaged && image.stagedUrl) {
            mockExports.push({
              type: 'staged' as const,
              resolution: resolution.name,
              dataUrl: `data:image/jpeg;base64,mock-staged-${image._id}-${resolution.name}`,
              filename: `staged_${resolution.name.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`,
            });
          }
        }
        
        allExports.push({
          imageId: image._id,
          exports: mockExports,
        });
      }

      // Flatten all exports for storage
      const flatExports = allExports.flatMap(item => 
        item.exports.map(exp => ({
          imageId: item.imageId,
          type: exp.type,
          resolution: exp.resolution,
          url: exp.dataUrl,
          filename: exp.filename,
        }))
      );

      // Update export record with results
      await ctx.runMutation(api.mlsCompliance.updateExportRecord, {
        exportId,
        status: "completed",
        exports: flatExports,
        complianceValidated: allCompliant,
        completedAt: Date.now(),
      });

      return {
        success: true,
        exportId,
        exports: flatExports,
        complianceValidated: allCompliant,
        complianceIssues: complianceIssues.map(issue => ({ type: 'compliance', message: issue })),
        totalFiles: flatExports.length,
      };

    } catch (error) {
      console.error("MLS export failed:", error);
      
      // Update export record with failure
      await ctx.runMutation(api.mlsCompliance.updateExportRecord, {
        exportId,
        status: "failed",
        exports: [],
        complianceValidated: false,
        completedAt: Date.now(),
      });

      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Create export record
 */
export const createExportRecord = mutation({
  args: {
    projectId: v.id("projects"),
    imageIds: v.array(v.id("images")),
    exportOptions: v.object({
      includeOriginal: v.boolean(),
      includeStaged: v.boolean(),
      resolutions: v.array(v.string()),
      watermarkOptions: v.optional(v.object({
        text: v.string(),
        position: v.string(),
        opacity: v.number(),
        fontSize: v.number(),
        color: v.string(),
      })),
    }),
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

    const exportType = args.exportOptions.includeOriginal && args.exportOptions.includeStaged 
      ? "both" 
      : args.exportOptions.includeOriginal 
        ? "original" 
        : "staged";

    const exportId = await ctx.db.insert("mlsExports", {
      userId: user._id,
      projectId: args.projectId,
      imageIds: args.imageIds,
      exportType,
      resolutions: args.exportOptions.resolutions,
      watermarkSettings: args.exportOptions.watermarkOptions || DEFAULT_WATERMARK,
      complianceValidated: false,
      exportUrls: [],
      status: "processing",
      createdAt: Date.now(),
    });

    return exportId;
  },
});

/**
 * Update export record
 */
export const updateExportRecord = mutation({
  args: {
    exportId: v.id("mlsExports"),
    status: v.string(),
    exports: v.array(v.object({
      imageId: v.id("images"),
      type: v.string(),
      resolution: v.string(),
      url: v.string(),
      filename: v.string(),
    })),
    complianceValidated: v.boolean(),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updateData: { status: string; exportUrls: Array<{ type: string; filename: string; resolution: string; url: string }>; updatedAt: number; complianceValidated?: boolean; completedAt?: number } = {
      status: args.status,
      exportUrls: args.exports.map(exp => ({
        type: exp.type,
        filename: exp.filename || `${exp.type}.jpg`,
        resolution: exp.resolution,
        url: exp.url,
      })),
      updatedAt: Date.now(),
      complianceValidated: args.complianceValidated,
    };

    if (args.completedAt) {
      updateData.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.exportId, updateData);
  },
});

/**
 * Get MLS exports for a project
 */
export const getProjectMLSExports = query({
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

    // Get exports for this project
    const exports = await ctx.db
      .query("mlsExports")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return exports;
  },
});

/**
 * Get compliance status for project images
 */
export const getProjectComplianceStatus = query({
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

    // Calculate compliance statistics
    let totalImages = 0;
    let stagedImages = 0;
    let compliantImages = 0;
    let nonCompliantImages = 0;
    let pendingValidation = 0;

    const complianceIssues: Array<{
      imageId: string;
      filename: string;
      violations: string[];
      warnings: string[];
    }> = [];

    for (const image of images) {
      totalImages++;
      
      if (image.stagedUrl) {
        stagedImages++;
        
        if (image.mlsCompliance) {
          if (image.mlsCompliance.isCompliant) {
            compliantImages++;
          } else {
            nonCompliantImages++;
            complianceIssues.push({
              imageId: image._id,
              filename: image.filename,
              violations: image.mlsCompliance.violations,
              warnings: image.mlsCompliance.warnings,
            });
          }
        } else {
          pendingValidation++;
        }
      }
    }

    return {
      totalImages,
      stagedImages,
      compliantImages,
      nonCompliantImages,
      pendingValidation,
      complianceRate: stagedImages > 0 ? (compliantImages / stagedImages) * 100 : 0,
      complianceIssues,
    };
  },
});

/**
 * Get MLS compliance guidelines
 */
export const getComplianceGuidelines = query({
  args: {},
  handler: async () => {
    return getMLSComplianceGuidelines();
  },
});

/**
 * Get available export resolutions
 */
export const getExportResolutions = query({
  args: {},
  handler: async () => {
    return MLS_EXPORT_RESOLUTIONS;
  },
});

/**
 * Batch validate compliance for multiple images
 */
export const batchValidateCompliance = action({
  args: {
    imageIds: v.array(v.id("images")),
  },
  handler: async (ctx, args): Promise<Array<{ imageId: string; success: boolean; compliance: { isCompliant: boolean; score: number; violations: string[]; warnings: string[]; recommendations: string[] }; structural: { isCompliant: boolean; violations: string[]; warnings: string[]; confidence: number } } | { imageId: string; success: boolean; error: string }>> => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("User not found");
    }

    const results = [];
    
    for (const imageId of args.imageIds) {
      try {
        // Get image and verify ownership
        const image = await ctx.runQuery(api.images.getImageById, { imageId });
        if (!image) {
          throw new Error("Image not found");
        }

        // Verify ownership through project
        const project = await ctx.runQuery(api.projects.getProject, { projectId: image.projectId });
        if (!project || project.userId !== user._id) {
          throw new Error("Access denied");
        }

        // Check if image has been staged
        if (!image.stagedUrl || image.status !== "staged") {
          throw new Error("Image must be staged before compliance validation");
        }

        // Mock compliance check for now
        const complianceResult = {
          isCompliant: true,
          score: 85,
          violations: [],
          warnings: ['Minor lighting adjustment recommended'],
          recommendations: ['Consider adjusting furniture placement'],
        };

        const structuralValidation = {
          isCompliant: true,
          violations: [],
          warnings: [],
          confidence: 0.9,
        };

        // Update image with compliance data
        await ctx.runMutation(api.mlsCompliance.updateImageCompliance, {
          imageId,
          complianceData: {
            isCompliant: complianceResult.isCompliant,
            score: complianceResult.score,
            violations: complianceResult.violations,
            warnings: complianceResult.warnings,
            lastChecked: Date.now(),
            structuralPreservation: {
              validated: true,
              confidence: structuralValidation.confidence,
              issues: structuralValidation.violations,
            },
            watermarkApplied: image.stagedUrl.includes('Virtually Staged') || false,
          },
        });

        results.push({
          imageId,
          success: true,
          compliance: complianceResult,
          structural: structuralValidation,
        });
      } catch (error) {
        results.push({
          imageId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  },
});