import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { estimateProcessingTime, type StylePreset, getStylePresets as geminiGetStylePresets } from "./lib/gemini";
import { stageImage as integrateStageImage } from "@integrations/gemini";
import { z } from "zod";
import { logger } from "./lib/logger";
import { presignGet } from "@integrations/r2";
import { uploadStagedImageToR2 } from "./imageUpload";

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
    logger.info("stagingJobs.create: begin");
    
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      logger.warn("stagingJobs.create: unauthenticated");
      throw new Error("Not authenticated");
    }
    logger.debug("stagingJobs.create: authenticated", { user: identity.subject });

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      logger.warn("stagingJobs.create: user not found", { user: identity.subject });
      throw new Error("User not found");
    }
    logger.debug("stagingJobs.create: user found", { credits: user.credits });

    // Verify project ownership
    logger.debug("stagingJobs.create: verifying project", { projectId: String(args.projectId) });
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== user._id) {
      logger.warn("stagingJobs.create: project verify failed", { projectFound: !!project });
      throw new Error("Project not found or access denied");
    }
    logger.debug("stagingJobs.create: project verified");

    // Verify all images belong to the project and user
    logger.debug("stagingJobs.create: verifying images", { count: args.imageIds.length });
    await Promise.all(
      args.imageIds.map(async (imageId) => {
        const image = await ctx.db.get(imageId);
        if (!image || image.projectId !== args.projectId || image.userId !== user._id) {
          logger.warn("stagingJobs.create: image verify failed", { imageId: String(imageId), imageFound: !!image });
          throw new Error(`Image ${imageId} not found or access denied`);
        }
        if (image.status !== "uploaded") {
          logger.warn("stagingJobs.create: image status invalid", { imageId: String(imageId), status: image.status });
          throw new Error(`Image ${image.filename} is not ready for staging (status: ${image.status})`);
        }
        logger.debug("stagingJobs.create: image verified", { filename: image.filename, status: image.status });
        return image;
      })
    );

    // Check if user has enough credits
    const creditsRequired = args.imageIds.length;
    logger.debug("stagingJobs.create: checking credits", { required: creditsRequired, available: user.credits });
    const creditCheck = await ctx.runQuery(api.users.checkSufficientCredits, {
      userId: user._id,
      requiredCredits: creditsRequired,
    });
    
    if (!creditCheck.sufficient) {
      logger.warn("stagingJobs.create: insufficient credits");
      throw new Error(creditCheck.message);
    }
    logger.debug("stagingJobs.create: credits sufficient");

    // Validate style preset
    console.log("🔍 Validating style preset:", args.stylePreset);
    const validStyles = ["minimal", "scandinavian", "bohemian", "modern", "traditional"];
    if (!validStyles.includes(args.stylePreset)) {
      console.error("❌ Invalid style preset:", args.stylePreset, "Valid styles:", validStyles);
      throw new Error("Invalid style preset");
    }
    console.log("✅ Style preset valid:", args.stylePreset);

    // Create staging job
    logger.info("stagingJobs.create: creating job");
    const jobId = await ctx.db.insert("stagingJobs", {
      userId: user._id,
      projectId: project._id,
      imageIds: args.imageIds,
      stylePreset: args.stylePreset,
      customPrompt: args.customPrompt,
      status: "queued",
      creditsUsed: creditsRequired,
      createdAt: Date.now(),
    });
    logger.info("stagingJobs.create: job created", { jobId: String(jobId) });

    // Deduct credits using enhanced function
    logger.debug("stagingJobs.create: deducting credits");
    await ctx.runMutation(api.users.deductCredits, {
      userId: user._id,
      amount: creditsRequired,
      description: `Batch staging: ${creditsRequired} images with ${args.stylePreset} style`,
      relatedJobId: jobId,
    });
    logger.debug("stagingJobs.create: credits deducted");

    // Update image statuses to processing
    logger.debug("stagingJobs.create: updating image statuses");
    await Promise.all(
      args.imageIds.map(async (imageId) => {
        await ctx.db.patch(imageId, {
          status: "processing",
          updatedAt: Date.now(),
        });
      })
    );
    logger.debug("stagingJobs.create: image statuses updated");

    // Schedule the actual processing (this would trigger the AI processing)
    logger.info("stagingJobs.create: scheduling job", { jobId: String(jobId) });
    await ctx.scheduler.runAfter(0, api.stagingJobs.processStagingJob, { jobId });
    logger.info("stagingJobs.create: scheduled", { jobId: String(jobId) });

    console.log("=== STAGING JOB CREATION COMPLETE ===");
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
    logger.info("stagingJobs.process: begin", { jobId: String(args.jobId) });
    
    // Get the staging job
    const job = await ctx.runQuery(api.stagingJobs.getStagingJob, { jobId: args.jobId });
    if (!job) {
      logger.warn("stagingJobs.process: job not found", { jobId: String(args.jobId) });
      throw new Error("Staging job not found");
    }

    logger.debug("stagingJobs.process: status", { jobId: String(args.jobId), status: job.status });
    if (job.status !== "queued") {
      logger.info("stagingJobs.process: not queued", { jobId: String(args.jobId), status: job.status });
      return;
    }

    // Check if job is too old (stuck for more than 30 minutes)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    if (job.createdAt < thirtyMinutesAgo) {
      logger.info("stagingJobs.process: job stale -> mark failed", { jobId: String(args.jobId) });
      await ctx.runMutation(api.stagingJobs.updateStagingJobStatus, {
        jobId: args.jobId,
        status: "failed",
        completedAt: Date.now(),
      });
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

          // Generate fresh signed URL for the image directly
          logger.debug("stagingJobs.process: presign image", { imageId: String(image._id) });
          let signedImageUrl: string;
          try {
            if (!image.imageKey) {
              throw new Error("Image key not found");
            }

            // Generate signed URL via integrations adapter
            const { url } = await presignGet({ key: image.imageKey, expiresIn: 3600, bucket: process.env.R2_BUCKET_OG! });
            signedImageUrl = url;
            
            logger.debug("stagingJobs.process: presign OK", { imageId: String(image._id) });
          } catch (urlError) {
            logger.warn("stagingJobs.process: presign failed", { imageId: String(image._id), error: urlError instanceof Error ? urlError.message : String(urlError) });
            throw new Error(`Failed to access image: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
          }

          // Add timeout wrapper for entire image processing
          const processingPromise = (async () => {
            logger.debug("stagingJobs.process: skip validation", { imageId: String(image._id) });
            
            // Validation temporarily disabled due to memory constraints
            // TODO: Implement memory-efficient validation or client-side validation

            logger.info("stagingJobs.process: staging start", { imageId: String(image._id) });
            
            // Estimate processing time for user feedback
            const estimatedTime = estimateProcessingTime(image.fileSize, image.roomType);
            logger.debug("stagingJobs.process: estimated", { ms: estimatedTime });

            // Stage the image via integrations adapter (with shared retries)
            const stagingResult = await integrateStageImage(signedImageUrl, {
              stylePreset: job.stylePreset as StylePreset,
              roomType: image.roomType,
              customPrompt: job.customPrompt,
              seed: job.createdAt,
            });

            // Validate adapter response shape minimally
            const StagingResultSchema = z.object({
              success: z.boolean(),
              stagedImageUrl: z.string().url().optional(),
              error: z.string().optional(),
              processingTime: z.number(),
              confidence: z.number().optional(),
            });
            StagingResultSchema.parse(stagingResult);

            logger.info("stagingJobs.process: staging done", { imageId: String(image._id) });
            return stagingResult;
          })();

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Image processing timeout (5 minutes)")), 300000); // 5 minute timeout
          });

          const stagingResult = await Promise.race([processingPromise, timeoutPromise]);

          if (stagingResult.success && stagingResult.stagedImageUrl) {
            logger.debug("stagingJobs.process: upload staged", { imageId: String(image._id) });
            
            // Apply watermark for MLS compliance (temporarily disabled)
            const finalStagedUrl = stagingResult.stagedImageUrl;
            try {
              // TODO: Re-enable watermarking once Canvas issues are resolved
              // const { applyWatermark, DEFAULT_WATERMARK } = await import("./lib/mlsCompliance");
              // finalStagedUrl = await applyWatermark(stagingResult.stagedImageUrl, DEFAULT_WATERMARK);
              logger.debug("stagingJobs.process: watermark disabled", { imageId: String(image._id) });
            } catch (watermarkError) {
              console.warn(`Failed to apply watermark to image ${image._id}:`, watermarkError);
              // Continue with unwatermarked image
            }

            // Upload staged image to R2
            // Derive file extension from data URL mime type
            const mimeMatch = finalStagedUrl.match(/^data:(.*?);base64,/);
            const mime = mimeMatch ? mimeMatch[1] : "image/png";
            const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "png";
            const stagedKey = `staged/${image._id}_${Date.now()}.${ext}`;
            const r2StagedUrl = await uploadStagedImageToR2(finalStagedUrl, stagedKey);
            
            logger.info("stagingJobs.process: uploaded staged");

            // Update image with staged result (store R2 URL, not base64 data)
            await ctx.runMutation(api.images.updateImageWithStagedResult, {
              imageId: image._id,
              stagedUrl: r2StagedUrl,
              stagedKey: stagedKey,
              version: {
                stylePreset: job.stylePreset,
                customPrompt: job.customPrompt,
                seed: job.createdAt,
                aiModel: "gemini-2.5-flash-image-preview",
                processingTime: stagingResult.processingTime,
                pinned: false,
              },
            });

            // Update image metadata with AI processing info
            await ctx.runMutation(api.images.updateImageMetadata, {
              imageId: image._id,
              metadata: {
                ...image.metadata,
                processingTime: stagingResult.processingTime,
                confidence: stagingResult.confidence,
                stylePreset: job.stylePreset,
                aiModel: "gemini-2.5-flash-image-preview",
              },
            });

            // Validate MLS compliance in background
            try {
              await ctx.runAction(api.mlsCompliance.validateImageCompliance, {
                imageId: image._id,
              });
              logger.debug("stagingJobs.process: compliance validated", { imageId: String(image._id) });
            } catch (complianceError) {
              console.warn(`Failed to validate compliance for image ${image._id}:`, complianceError);
              // Don't fail the staging job for compliance validation errors
            }

            results.push({
              imageId: image._id,
              stagedUrl: r2StagedUrl,
              success: true,
            });

            successCount++;
            logger.info("stagingJobs.process: image staged", { imageId: String(image._id), ms: stagingResult.processingTime });

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
            logger.warn("stagingJobs.process: stage failed", { imageId: String(image._id), error: stagingResult.error });
          }

          // Update job with partial results after each image
          await ctx.runMutation(api.stagingJobs.updateStagingJobResults, {
            jobId: args.jobId,
            results,
          });

        } catch (error) {
          logger.error("stagingJobs.process: image error", { imageId: String(image._id), error: error instanceof Error ? error.message : String(error) });
          
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

      logger.info("stagingJobs.process: done", { jobId: String(args.jobId), successCount, failureCount });

      // If all images failed, consider refunding credits
      if (successCount === 0 && failureCount > 0) {
        logger.info("stagingJobs.process: all failed -> consider refund");
        // Optionally implement partial refund logic here
      }

    } catch (error) {
      logger.error("stagingJobs.process: failed", { jobId: String(args.jobId), error: error instanceof Error ? error.message : String(error) });
      
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

    // Query by projectId index directly for efficiency
    const jobs = await ctx.db
      .query("stagingJobs")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.and(q.neq(q.field("status"), "completed"), q.neq(q.field("status"), "failed")))
      .collect();

    return jobs;
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
    const updateData: { status: string; updatedAt: number; completedAt?: number } = {
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
      updatedAt: Date.now(),
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
  handler: async () => {
    return geminiGetStylePresets();
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
      projectId: originalJob.projectId,
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
 * Process any stuck staging jobs (recovery function)
 */
export const processStuckJobs = action({
  args: {},
  handler: async (ctx): Promise<{ stuckJobsFound: number; stuckJobsRescheduled: number }> => {
    console.log("Checking for stuck staging jobs...");
    
    // Find all jobs that are stuck in "processing" status for more than 10 minutes
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const allJobs = await ctx.runQuery(api.stagingJobs.getAllProcessingJobs);
    
    const stuckJobs = allJobs.filter((job: { status: string; createdAt: number; updatedAt?: number }) => 
      job.status === "processing" && (job.updatedAt ?? job.createdAt) < tenMinutesAgo
    );
    
    console.log(`Found ${stuckJobs.length} stuck processing jobs`);
    
    // Mark stuck jobs as failed and reset image statuses
    for (const job of stuckJobs) {
      console.log(`Marking stuck job ${job._id} as failed`);
      try {
        // Mark job as failed
        await ctx.runMutation(api.stagingJobs.updateStagingJobStatus, {
          jobId: job._id,
          status: "failed",
          completedAt: Date.now(),
        });

        // Reset image statuses to uploaded
        await Promise.all(
          job.imageIds.map(async (imageId: Id<"images">) => {
            await ctx.runMutation(api.images.updateImageStatus, {
              imageId,
              status: "uploaded",
            });
          })
        );

        console.log(`Reset job ${job._id} and its images`);
      } catch (error) {
        console.error(`Failed to reset job ${job._id}:`, error);
      }
    }
    
    return {
      stuckJobsFound: stuckJobs.length,
      stuckJobsRescheduled: 0, // We're marking as failed, not rescheduling
    };
  },
});

/**
 * Get all processing jobs (helper for recovery)
 */
export const getAllProcessingJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stagingJobs")
      .filter((q) => q.eq(q.field("status"), "processing"))
      .collect();
  },
});

/**
 * Manual trigger to process stuck jobs (can be called from UI)
 */
export const triggerStuckJobRecovery = action({
  args: {},
  handler: async (ctx): Promise<{ stuckJobsFound: number; stuckJobsRescheduled: number }> => {
    // Get current user (optional - could be admin only)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    console.log("Manual trigger for stuck job recovery");
    return await ctx.runAction(api.stagingJobs.processStuckJobs, {});
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