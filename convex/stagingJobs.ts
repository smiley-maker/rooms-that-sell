import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { stageImageWithGeminiRetry, validateImageForStaging, estimateProcessingTime, type StylePreset } from "./lib/gemini";

/**
 * Create a new staging job for batch processing
 */
export const createStagingJob = mutation({
  args: {
    projectId: v.id("projects"),
    imageIds: v.array(v.id("images")),
    stylePreset: v.string(),
    customPrompt: v.optional(v.string()),
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

    // Verify all images belong to the project and user
    const images = await Promise.all(
      args.imageIds.map(async (imageId) => {
        const image = await ctx.db.get(imageId);
        if (!image || image.projectId !== args.projectId || image.userId !== user._id) {
          throw new Error(`Image ${imageId} not found or access denied`);
        }
        if (image.status !== "uploaded") {
          throw new Error(`Image ${image.filename} is not ready for staging (status: ${image.status})`);
        }
        return image;
      })
    );

    // Check if user has enough credits
    const creditsRequired = args.imageIds.length;
    if (user.credits < creditsRequired) {
      throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits}`);
    }

    // Validate style preset
    const validStyles = ["minimal", "scandinavian", "bohemian", "modern", "traditional"];
    if (!validStyles.includes(args.stylePreset)) {
      throw new Error("Invalid style preset");
    }

    // Create staging job
    const jobId = await ctx.db.insert("stagingJobs", {
      userId: user._id,
      imageIds: args.imageIds,
      stylePreset: args.stylePreset,
      customPrompt: args.customPrompt,
      status: "queued",
      creditsUsed: creditsRequired,
      createdAt: Date.now(),
    });

    // Deduct credits from user account
    await ctx.db.patch(user._id, {
      credits: user.credits - creditsRequired,
    });

    // Create credit transaction record
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "usage",
      amount: -creditsRequired,
      description: `Batch staging: ${creditsRequired} images with ${args.stylePreset} style`,
      relatedJobId: jobId,
      createdAt: Date.now(),
    });

    // Update image statuses to processing
    await Promise.all(
      args.imageIds.map(async (imageId) => {
        await ctx.db.patch(imageId, {
          status: "processing",
          updatedAt: Date.now(),
        });
      })
    );

    // Schedule the actual processing (this would trigger the AI processing)
    console.log(`Scheduling processing for job ${jobId}`);
    await ctx.scheduler.runAfter(0, api.stagingJobs.processStagingJob, { jobId });
    console.log(`Job ${jobId} scheduled successfully`);

    return jobId;
  },
});

/**
 * Process a staging job using Gemini 2.5 Flash Image API
 */
export const processStagingJob = action({
  args: {
    jobId: v.id("stagingJobs"),
  },
  handler: async (ctx, args) => {
    console.log(`Processing staging job ${args.jobId}`);
    
    // Get the staging job
    const job = await ctx.runQuery(api.stagingJobs.getStagingJob, { jobId: args.jobId });
    if (!job) {
      console.error(`Staging job ${args.jobId} not found`);
      throw new Error("Staging job not found");
    }

    console.log(`Job ${args.jobId} status: ${job.status}`);
    if (job.status !== "queued") {
      console.log(`Job ${args.jobId} is not queued (status: ${job.status})`);
      return;
    }

    // Update job status to processing
    await ctx.runMutation(api.stagingJobs.updateStagingJobStatus, {
      jobId: args.jobId,
      status: "processing",
    });

    try {
      // Get images for the job
      const images = await Promise.all(
        job.imageIds.map(async (imageId: Id<"images">) => {
          return await ctx.runQuery(api.images.getImageById, { imageId });
        })
      );

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      // Process each image with Gemini API
      for (const image of images) {
        if (!image) {
          console.warn(`Image not found for ID: ${image}`);
          continue;
        }

        try {
          console.log(`Processing image ${image._id} with style ${job.stylePreset}`);

          // Validate image before processing
          const validation = await validateImageForStaging(image.originalUrl);
          if (!validation.isValid) {
            throw new Error(`Image validation failed: ${validation.issues.join(', ')}`);
          }

          // Estimate processing time for user feedback
          const estimatedTime = estimateProcessingTime(image.fileSize, image.roomType);
          console.log(`Estimated processing time: ${estimatedTime}ms`);

          // Stage the image with Gemini (with retry logic)
          const stagingResult = await stageImageWithGeminiRetry(image.originalUrl, {
            stylePreset: job.stylePreset as StylePreset,
            roomType: image.roomType,
            customPrompt: job.customPrompt,
          });

          if (stagingResult.success && stagingResult.stagedImageUrl) {
            // Apply watermark for MLS compliance
            let finalStagedUrl = stagingResult.stagedImageUrl;
            try {
              const { applyWatermark, DEFAULT_WATERMARK } = await import("./lib/mlsCompliance");
              finalStagedUrl = await applyWatermark(stagingResult.stagedImageUrl, DEFAULT_WATERMARK);
              console.log(`Applied MLS watermark to image ${image._id}`);
            } catch (watermarkError) {
              console.warn(`Failed to apply watermark to image ${image._id}:`, watermarkError);
              // Continue with unwatermarked image
            }

            // Update image with staged result
            await ctx.runMutation(api.images.updateImageWithStagedResult, {
              imageId: image._id,
              stagedUrl: finalStagedUrl,
              stagedKey: `staged/${image._id}_${Date.now()}.jpg`,
            });

            // Update image metadata with AI processing info
            await ctx.runMutation(api.images.updateImageMetadata, {
              imageId: image._id,
              metadata: {
                ...image.metadata,
                processingTime: stagingResult.processingTime,
                confidence: stagingResult.confidence,
                stylePreset: job.stylePreset,
                aiModel: "gemini-2.0-flash-exp",
              },
            });

            // Validate MLS compliance in background
            try {
              await ctx.runAction(api.mlsCompliance.validateImageCompliance, {
                imageId: image._id,
              });
              console.log(`MLS compliance validated for image ${image._id}`);
            } catch (complianceError) {
              console.warn(`Failed to validate compliance for image ${image._id}:`, complianceError);
              // Don't fail the staging job for compliance validation errors
            }

            results.push({
              imageId: image._id,
              stagedUrl: finalStagedUrl,
              success: true,
            });

            successCount++;
            console.log(`Successfully staged image ${image._id} in ${stagingResult.processingTime}ms`);

          } else {
            // Handle staging failure
            await ctx.runMutation(api.images.updateImageStatus, {
              imageId: image._id,
              status: "uploaded", // Reset to uploaded so it can be retried
            });

            results.push({
              imageId: image._id,
              stagedUrl: "",
              success: false,
              error: stagingResult.error || "AI processing failed",
            });

            failureCount++;
            console.error(`Failed to stage image ${image._id}: ${stagingResult.error}`);
          }

          // Update job with partial results after each image
          await ctx.runMutation(api.stagingJobs.updateStagingJobResults, {
            jobId: args.jobId,
            results,
          });

        } catch (error) {
          console.error(`Failed to process image ${image._id}:`, error);
          
          // Reset image status on error
          await ctx.runMutation(api.images.updateImageStatus, {
            imageId: image._id,
            status: "uploaded",
          });

          results.push({
            imageId: image._id,
            stagedUrl: "",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          failureCount++;
        }
      }

      // Mark job as completed
      await ctx.runMutation(api.stagingJobs.updateStagingJobStatus, {
        jobId: args.jobId,
        status: "completed",
        completedAt: Date.now(),
      });

      console.log(`Staging job ${args.jobId} completed: ${successCount} successful, ${failureCount} failed`);

      // If all images failed, consider refunding credits
      if (successCount === 0 && failureCount > 0) {
        console.log("All images failed, considering partial refund");
        // Optionally implement partial refund logic here
      }

    } catch (error) {
      console.error(`Staging job ${args.jobId} failed:`, error);
      
      // Mark job as failed
      await ctx.runMutation(api.stagingJobs.updateStagingJobStatus, {
        jobId: args.jobId,
        status: "failed",
        completedAt: Date.now(),
      });

      // Reset all image statuses
      await Promise.all(
        job.imageIds.map(async (imageId: Id<"images">) => {
          await ctx.runMutation(api.images.updateImageStatus, {
            imageId,
            status: "uploaded",
          });
        })
      );

      // Refund credits on complete failure
      const user = await ctx.runQuery(api.users.getUserById, { userId: job.userId });
      if (user) {
        await ctx.runMutation(api.users.updateUserCredits, {
          userId: job.userId,
          credits: user.credits + job.creditsUsed,
        });

        // Create refund transaction
        await ctx.runMutation(api.creditTransactions.createTransaction, {
          userId: job.userId,
          type: "refund",
          amount: job.creditsUsed,
          description: `Refund for failed staging job: ${error instanceof Error ? error.message : 'Unknown error'}`,
          relatedJobId: args.jobId,
        });
      }

      throw error; // Re-throw to ensure proper error handling
    }
  },
});

/**
 * Get a staging job by ID
 */
export const getStagingJob = query({
  args: {
    jobId: v.id("stagingJobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

/**
 * Get active staging jobs for a project
 */
export const getActiveStagingJobs = query({
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

    // Get all staging jobs for this user that are not completed
    const jobs = await ctx.db
      .query("stagingJobs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.and(
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "failed")
        )
      )
      .collect();

    // Filter jobs that contain images from this project
    const projectJobs = [];
    for (const job of jobs) {
      // Check if any of the job's images belong to this project
      const hasProjectImages = await Promise.all(
        job.imageIds.map(async (imageId) => {
          const image = await ctx.db.get(imageId);
          return image?.projectId === args.projectId;
        })
      );
      
      if (hasProjectImages.some(Boolean)) {
        projectJobs.push(job);
      }
    }

    return projectJobs;
  },
});

/**
 * Get staging job history for a user
 */
export const getUserStagingJobs = query({
  args: {
    limit: v.optional(v.number()),
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

    // Get staging jobs for this user
    const jobs = await ctx.db
      .query("stagingJobs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return jobs;
  },
});

/**
 * Update staging job status
 */
export const updateStagingJobStatus = mutation({
  args: {
    jobId: v.id("stagingJobs"),
    status: v.string(),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.completedAt) {
      updateData.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.jobId, updateData);
  },
});

/**
 * Update staging job results
 */
export const updateStagingJobResults = mutation({
  args: {
    jobId: v.id("stagingJobs"),
    results: v.array(v.object({
      imageId: v.id("images"),
      stagedUrl: v.string(),
      success: v.boolean(),
      error: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      results: args.results,
    });
  },
});

/**
 * Cancel a staging job
 */
export const cancelStagingJob = mutation({
  args: {
    jobId: v.id("stagingJobs"),
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

    // Get job and verify ownership
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) {
      throw new Error("Job not found or access denied");
    }

    if (job.status === "completed" || job.status === "failed") {
      throw new Error("Cannot cancel completed or failed job");
    }

    // Update job status
    await ctx.db.patch(args.jobId, {
      status: "failed",
      completedAt: Date.now(),
    });

    // Reset image statuses
    await Promise.all(
      job.imageIds.map(async (imageId) => {
        const image = await ctx.db.get(imageId);
        if (image && image.status === "processing") {
          await ctx.db.patch(imageId, {
            status: "uploaded",
            updatedAt: Date.now(),
          });
        }
      })
    );

    // Refund credits
    await ctx.db.patch(user._id, {
      credits: user.credits + job.creditsUsed,
    });

    // Create refund transaction
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "refund",
      amount: job.creditsUsed,
      description: "Refund for cancelled staging job",
      relatedJobId: args.jobId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});/**

 * Get available style presets for staging
 */
export const getStylePresets = query({
  args: {},
  handler: async (ctx, args) => {
    // Import the getStylePresets function from the Gemini utility
    const { getStylePresets } = await import("./lib/gemini");
    return getStylePresets();
  },
});



/**
 * Retry failed staging for specific images
 */
export const retryStagingJob = mutation({
  args: {
    jobId: v.id("stagingJobs"),
    imageIds: v.optional(v.array(v.id("images"))),
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

    // Get original job and verify ownership
    const originalJob = await ctx.db.get(args.jobId);
    if (!originalJob || originalJob.userId !== user._id) {
      throw new Error("Job not found or access denied");
    }

    // Determine which images to retry
    const imagesToRetry = args.imageIds || originalJob.imageIds;
    
    // Filter to only include failed images
    const failedImages = [];
    if (originalJob.results) {
      for (const imageId of imagesToRetry) {
        const result = originalJob.results.find(r => r.imageId === imageId);
        if (!result || !result.success) {
          failedImages.push(imageId);
        }
      }
    } else {
      // If no results, retry all requested images
      failedImages.push(...imagesToRetry);
    }

    if (failedImages.length === 0) {
      throw new Error("No failed images to retry");
    }

    // Check if user has enough credits for retry
    const creditsRequired = failedImages.length;
    if (user.credits < creditsRequired) {
      throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits}`);
    }

    // Create new staging job for retry
    const retryJobId = await ctx.db.insert("stagingJobs", {
      userId: user._id,
      imageIds: failedImages,
      stylePreset: originalJob.stylePreset,
      customPrompt: originalJob.customPrompt,
      status: "queued",
      creditsUsed: creditsRequired,
      createdAt: Date.now(),
    });

    // Deduct credits
    await ctx.db.patch(user._id, {
      credits: user.credits - creditsRequired,
    });

    // Create credit transaction
    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      type: "usage",
      amount: -creditsRequired,
      description: `Retry staging: ${creditsRequired} images with ${originalJob.stylePreset} style`,
      relatedJobId: retryJobId,
      createdAt: Date.now(),
    });

    // Update image statuses to processing
    await Promise.all(
      failedImages.map(async (imageId) => {
        await ctx.db.patch(imageId, {
          status: "processing",
          updatedAt: Date.now(),
        });
      })
    );

    // Schedule the processing
    await ctx.scheduler.runAfter(0, api.stagingJobs.processStagingJob, { jobId: retryJobId });

    return retryJobId;
  },
});

/**
 * Get staging job progress and statistics
 */
export const getStagingJobProgress = query({
  args: {
    jobId: v.id("stagingJobs"),
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

    // Get job and verify ownership
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) {
      throw new Error("Job not found or access denied");
    }

    // Calculate progress statistics
    const totalImages = job.imageIds.length;
    let processedImages = 0;
    let successfulImages = 0;
    let failedImages = 0;

    if (job.results) {
      processedImages = job.results.length;
      successfulImages = job.results.filter(r => r.success).length;
      failedImages = job.results.filter(r => !r.success).length;
    }

    const progressPercentage = totalImages > 0 ? (processedImages / totalImages) * 100 : 0;

    return {
      jobId: job._id,
      status: job.status,
      stylePreset: job.stylePreset,
      customPrompt: job.customPrompt,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      creditsUsed: job.creditsUsed,
      progress: {
        totalImages,
        processedImages,
        successfulImages,
        failedImages,
        progressPercentage: Math.round(progressPercentage),
      },
      results: job.results || [],
    };
  },
});