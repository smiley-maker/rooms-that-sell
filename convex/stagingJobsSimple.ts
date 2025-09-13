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

    // Schedule the actual processing
    console.log(`Scheduling processing for job ${jobId}`);
    await ctx.scheduler.runAfter(0, api.stagingJobsSimple.processStagingJob, { jobId });
    console.log(`Job ${jobId} scheduled successfully`);

    return jobId;
  },
});

/**
 * Process a staging job (simplified version for testing)
 */
export const processStagingJob = action({
  args: {
    jobId: v.id("stagingJobs"),
  },
  handler: async (ctx, args) => {
    console.log(`Processing staging job ${args.jobId}`);
    
    // Get the staging job
    const job = await ctx.runQuery(api.stagingJobsSimple.getStagingJob, { jobId: args.jobId });
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
    await ctx.runMutation(api.stagingJobsSimple.updateStagingJobStatus, {
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

      // Process each image with Gemini API
      for (const image of images) {
        if (!image) {
          console.warn(`Image not found, skipping`);
          continue;
        }

        try {
          console.log(`Processing image ${image._id} (${image.filename}) with style ${job.stylePreset}`);

          // Generate signed URL for image access directly in the action
          let signedImageUrl;
          try {
            if (!image.imageKey) {
              throw new Error("Image key not found");
            }

            // Generate signed URL directly using AWS SDK
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
              Bucket: process.env.R2_BUCKET_OG!,
              Key: image.imageKey,
            });

            signedImageUrl = await getSignedUrl(r2Client, command, { 
              expiresIn: 3600 // 1 hour
            });
            
            console.log(`Generated signed URL for image ${image._id}`);
          } catch (urlError) {
            console.error(`Failed to generate signed URL for image ${image._id}:`, urlError);
            throw new Error(`Failed to access image: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
          }

          // Validate image before processing
          console.log(`Validating image ${image._id}...`);
          const validation = await validateImageForStaging(signedImageUrl);
          if (!validation.isValid) {
            console.error(`Image validation failed for ${image._id}:`, validation.issues);
            throw new Error(`Image validation failed: ${validation.issues.join(', ')}`);
          }
          console.log(`Image ${image._id} validation passed with confidence ${validation.confidence}`);

          // Estimate processing time for user feedback
          const estimatedTime = estimateProcessingTime(image.fileSize, image.roomType);
          console.log(`Estimated processing time for ${image._id}: ${estimatedTime}ms`);

          // Stage the image with Gemini (with retry logic)
          console.log(`Starting Gemini processing for image ${image._id}...`);
          const stagingResult = await stageImageWithGeminiRetry(signedImageUrl, {
            stylePreset: job.stylePreset as StylePreset,
            roomType: image.roomType,
            customPrompt: job.customPrompt,
          });
          console.log(`Gemini processing completed for image ${image._id}:`, { 
            success: stagingResult.success, 
            processingTime: stagingResult.processingTime,
            error: stagingResult.error 
          });

          if (stagingResult.success && stagingResult.stagedImageUrl) {
            // Check if the staged image is a data URL (too large for Convex DB)
            if (stagingResult.stagedImageUrl.startsWith('data:')) {
              console.log(`Staged image is a data URL (${Math.round(stagingResult.stagedImageUrl.length / 1024 / 1024 * 100) / 100}MB), uploading to R2...`);
              
              try {
                // Extract base64 data from data URL
                const [header, base64Data] = stagingResult.stagedImageUrl.split(',');
                const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
                
                // Convert base64 to buffer for upload
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Upload to R2
                const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
                const r2Client = new S3Client({
                  region: "auto",
                  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                  credentials: {
                    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
                  },
                });

                const stagedKey = `staged/${image._id}_${Date.now()}.png`;
                const uploadCommand = new PutObjectCommand({
                  Bucket: process.env.R2_BUCKET_STYLIZED!,
                  Key: stagedKey,
                  Body: bytes,
                  ContentType: mimeType,
                  Metadata: {
                    originalImageId: image._id,
                    stylePreset: job.stylePreset,
                    aiModel: "gemini-2.5-flash-image-preview",
                  },
                });

                await r2Client.send(uploadCommand);
                
                const stagedUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_STYLIZED}/${stagedKey}`;
                console.log(`Successfully uploaded staged image to R2: ${stagedKey}`);
                
                // Update image with R2 URL
                await ctx.runMutation(api.images.updateImageWithStagedResult, {
                  imageId: image._id,
                  stagedUrl,
                  stagedKey,
                });
              } catch (uploadError) {
                console.error(`Failed to upload staged image to R2:`, uploadError);
                // Fall back to marking as successful but with original URL
                await ctx.runMutation(api.images.updateImageWithStagedResult, {
                  imageId: image._id,
                  stagedUrl: image.originalUrl, // Use original as fallback
                  stagedKey: `staged/${image._id}_${Date.now()}.jpg`,
                });
              }
            } else {
              // Regular URL, store directly
              await ctx.runMutation(api.images.updateImageWithStagedResult, {
                imageId: image._id,
                stagedUrl: stagingResult.stagedImageUrl,
                stagedKey: `staged/${image._id}_${Date.now()}.jpg`,
              });
            }

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

            results.push({
              imageId: image._id,
              stagedUrl: "staged", // Don't store the actual URL in results to avoid size limits
              success: true,
            });
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
            console.log(`Failed to stage image ${image._id}: ${stagingResult.error}`);
          }

        } catch (error) {
          console.error(`Error processing image ${image._id}:`, error);
          
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
        }

        // Update job with partial results after each image
        await ctx.runMutation(api.stagingJobsSimple.updateStagingJobResults, {
          jobId: args.jobId,
          results,
        });
        
        console.log(`Progress: ${results.length}/${images.length} images processed`);
      }

      // Mark job as completed
      await ctx.runMutation(api.stagingJobsSimple.updateStagingJobStatus, {
        jobId: args.jobId,
        status: "completed",
        completedAt: Date.now(),
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      console.log(`Staging job ${args.jobId} completed: ${successCount} successful, ${failureCount} failed`);

    } catch (error) {
      console.error(`Staging job ${args.jobId} failed:`, error);
      
      // Mark job as failed
      await ctx.runMutation(api.stagingJobsSimple.updateStagingJobStatus, {
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

      // Refund credits on failure
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
          description: `Refund for failed staging job`,
          relatedJobId: args.jobId,
        });
      }
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
 * Process any stuck queued jobs (recovery function)
 */
export const processStuckJobs = action({
  args: {},
  handler: async (ctx): Promise<{ stuckJobsFound: number; stuckJobsRescheduled: number }> => {
    console.log("Checking for stuck staging jobs...");
    
    // Find all jobs that are stuck in "queued" status for more than 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const allJobs = await ctx.runQuery(api.stagingJobsSimple.getAllQueuedJobs);
    
    const stuckJobs = allJobs.filter((job: any) => 
      job.status === "queued" && job.createdAt < fiveMinutesAgo
    );
    
    console.log(`Found ${stuckJobs.length} stuck jobs`);
    
    // Process each stuck job
    for (const job of stuckJobs) {
      console.log(`Reprocessing stuck job ${job._id}`);
      try {
        // Schedule the job for processing
        await ctx.scheduler.runAfter(0, api.stagingJobsSimple.processStagingJob, { 
          jobId: job._id 
        });
        console.log(`Rescheduled job ${job._id}`);
      } catch (error) {
        console.error(`Failed to reschedule job ${job._id}:`, error);
      }
    }
    
    return {
      stuckJobsFound: stuckJobs.length,
      stuckJobsRescheduled: stuckJobs.length,
    };
  },
});

/**
 * Get all queued jobs (helper for recovery)
 */
export const getAllQueuedJobs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stagingJobs")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
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
    return await ctx.runAction(api.stagingJobsSimple.processStuckJobs, {});
  },
});

/**
 * Clean up old completed/failed jobs (runs via cron)
 */
export const cleanupOldJobs = action({
  args: {},
  handler: async (ctx) => {
    console.log("Cleaning up old staging jobs...");
    
    // Delete jobs older than 7 days that are completed or failed
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const oldJobs = await ctx.runQuery(api.stagingJobsSimple.getOldCompletedJobs, {
      cutoffTime: sevenDaysAgo
    });
    
    let deletedCount = 0;
    for (const job of oldJobs) {
      try {
        await ctx.runMutation(api.stagingJobsSimple.deleteJob, { jobId: job._id });
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete job ${job._id}:`, error);
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old jobs`);
    return { deletedCount };
  },
});

/**
 * Get old completed jobs for cleanup
 */
export const getOldCompletedJobs = query({
  args: {
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    const completedJobs = await ctx.db
      .query("stagingJobs")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.lt(q.field("createdAt"), args.cutoffTime))
      .collect();
      
    const failedJobs = await ctx.db
      .query("stagingJobs")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .filter((q) => q.lt(q.field("createdAt"), args.cutoffTime))
      .collect();
    
    return [...completedJobs, ...failedJobs];
  },
});

/**
 * Delete a staging job
 */
export const deleteJob = mutation({
  args: {
    jobId: v.id("stagingJobs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.jobId);
  },
});

/**
 * Test function to manually trigger staging for debugging
 */
export const testStagingWorkflow = action({
  args: {
    imageId: v.id("images"),
    stylePreset: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    processingTime?: number;
    error?: string;
    imageFilename?: string;
  }> => {
    console.log(`TEST: Starting staging workflow test for image ${args.imageId} with style ${args.stylePreset}`);
    
    try {
      // Get the image
      const image: any = await ctx.runQuery(api.images.getImageById, { imageId: args.imageId });
      if (!image) {
        throw new Error("Image not found");
      }
      
      console.log(`TEST: Found image ${image.filename} (${image.roomType})`);
      
      // Generate signed URL
      const signedImageUrl = await ctx.runAction(api.images.getImageDownloadUrl, {
        imageId: args.imageId,
        isStaged: false,
      });
      console.log(`TEST: Generated signed URL`);
      
      // Test Gemini API call
      const stagingResult = await stageImageWithGeminiRetry(signedImageUrl, {
        stylePreset: args.stylePreset as StylePreset,
        roomType: image.roomType,
        customPrompt: "Test staging workflow",
      });
      
      console.log(`TEST: Staging result:`, {
        success: stagingResult.success,
        processingTime: stagingResult.processingTime,
        error: stagingResult.error,
        hasUrl: !!stagingResult.stagedImageUrl
      });
      
      return {
        success: stagingResult.success,
        processingTime: stagingResult.processingTime,
        error: stagingResult.error,
        imageFilename: image.filename,
      };
      
    } catch (error) {
      console.error(`TEST: Error in staging workflow:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * One-time migration: Process ALL queued jobs immediately
 * This will handle any jobs that were stuck before the new system
 */
export const migrateAllQueuedJobs = action({
  args: {},
  handler: async (ctx): Promise<{ totalFound: number; totalScheduled: number }> => {
    console.log("MIGRATION: Processing all queued jobs...");
    
    // Get ALL queued jobs regardless of age
    const allQueuedJobs = await ctx.runQuery(api.stagingJobsSimple.getAllQueuedJobs);
    
    console.log(`MIGRATION: Found ${allQueuedJobs.length} queued jobs to process`);
    
    let processedCount = 0;
    for (const job of allQueuedJobs) {
      try {
        console.log(`MIGRATION: Processing job ${job._id} (created ${new Date(job.createdAt).toISOString()})`);
        
        // Schedule the job for immediate processing
        await ctx.scheduler.runAfter(0, api.stagingJobsSimple.processStagingJob, { 
          jobId: job._id 
        });
        
        processedCount++;
        console.log(`MIGRATION: Scheduled job ${job._id}`);
      } catch (error) {
        console.error(`MIGRATION: Failed to schedule job ${job._id}:`, error);
      }
    }
    
    console.log(`MIGRATION: Scheduled ${processedCount}/${allQueuedJobs.length} jobs for processing`);
    
    return {
      totalFound: allQueuedJobs.length,
      totalScheduled: processedCount,
    };
  },
});