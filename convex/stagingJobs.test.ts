import { describe, it, expect, vi, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

// Mock the Gemini module
vi.mock("./lib/gemini", () => ({
  stageImageWithGeminiRetry: vi.fn().mockResolvedValue({
    success: true,
    stagedImageUrl: "https://example.com/staged.jpg",
    processingTime: 2500,
    confidence: 0.85,
  }),
  validateImageForStaging: vi.fn().mockResolvedValue({
    isValid: true,
    issues: [],
    confidence: 0.9,
  }),
  estimateProcessingTime: vi.fn().mockReturnValue(15000),
  getStylePresets: vi.fn().mockReturnValue([
    { id: "modern", name: "Modern", description: "Contemporary style" },
    { id: "minimal", name: "Minimal", description: "Clean and simple" },
  ]),
}));

describe("Staging Jobs Integration", () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create a test user
    const userId = await t.mutation(api.users.createUser, {
      clerkId: "test-user-123",
      email: "test@example.com",
      plan: "trial",
    });

    // Create a test project
    const projectId = await t.mutation(api.projects.createProject, {
      name: "Test Property",
      address: "123 Test St",
      listingType: "sale",
    });

    // Store for use in tests
    t.userId = userId;
    t.projectId = projectId;
  });

  describe("createStagingJob", () => {
    it("should create a staging job successfully", async () => {
      // Create a test image first
      const imageId = await t.mutation(api.images.createImageRecord, {
        projectId: t.projectId,
        imageKey: "test-image.jpg",
        filename: "living-room.jpg",
        fileSize: 1024 * 1024,
        contentType: "image/jpeg",
        dimensions: { width: 1920, height: 1080 },
        roomType: "living_room",
      });

      // Create staging job
      const jobId = await t.mutation(api.stagingJobs.createStagingJob, {
        projectId: t.projectId,
        imageIds: [imageId],
        stylePreset: "modern",
        customPrompt: "Add a cozy reading nook",
      });

      expect(jobId).toBeDefined();

      // Verify job was created
      const job = await t.query(api.stagingJobs.getStagingJob, { jobId });
      expect(job).toBeDefined();
      expect(job.stylePreset).toBe("modern");
      expect(job.customPrompt).toBe("Add a cozy reading nook");
      expect(job.status).toBe("queued");
      expect(job.imageIds).toHaveLength(1);
      expect(job.creditsUsed).toBe(1);
    });

    it("should reject job with insufficient credits", async () => {
      // Create multiple test images
      const imageIds = [];
      for (let i = 0; i < 15; i++) {
        const imageId = await t.mutation(api.images.createImageRecord, {
          projectId: t.projectId,
          imageKey: `test-image-${i}.jpg`,
          filename: `room-${i}.jpg`,
          fileSize: 1024 * 1024,
          contentType: "image/jpeg",
          dimensions: { width: 1920, height: 1080 },
          roomType: "living_room",
        });
        imageIds.push(imageId);
      }

      // Try to create job that requires more credits than available (user has 10 trial credits)
      await expect(
        t.mutation(api.stagingJobs.createStagingJob, {
          projectId: t.projectId,
          imageIds,
          stylePreset: "modern",
        })
      ).rejects.toThrow("Insufficient credits");
    });

    it("should validate style preset", async () => {
      const imageId = await t.mutation(api.images.createImageRecord, {
        projectId: t.projectId,
        imageKey: "test-image.jpg",
        filename: "living-room.jpg",
        fileSize: 1024 * 1024,
        contentType: "image/jpeg",
        dimensions: { width: 1920, height: 1080 },
        roomType: "living_room",
      });

      await expect(
        t.mutation(api.stagingJobs.createStagingJob, {
          projectId: t.projectId,
          imageIds: [imageId],
          stylePreset: "invalid-style",
        })
      ).rejects.toThrow("Invalid style preset");
    });
  });

  describe("getStylePresets", () => {
    it("should return available style presets", async () => {
      const presets = await t.query(api.stagingJobs.getStylePresets, {});
      
      expect(presets).toHaveLength(2);
      expect(presets[0]).toHaveProperty("id");
      expect(presets[0]).toHaveProperty("name");
      expect(presets[0]).toHaveProperty("description");
    });
  });

  describe("getStagingJobProgress", () => {
    it("should return job progress information", async () => {
      // Create test image and job
      const imageId = await t.mutation(api.images.createImageRecord, {
        projectId: t.projectId,
        imageKey: "test-image.jpg",
        filename: "living-room.jpg",
        fileSize: 1024 * 1024,
        contentType: "image/jpeg",
        dimensions: { width: 1920, height: 1080 },
        roomType: "living_room",
      });

      const jobId = await t.mutation(api.stagingJobs.createStagingJob, {
        projectId: t.projectId,
        imageIds: [imageId],
        stylePreset: "modern",
      });

      // Get progress
      const progress = await t.query(api.stagingJobs.getStagingJobProgress, { jobId });
      
      expect(progress).toBeDefined();
      expect(progress.jobId).toBe(jobId);
      expect(progress.status).toBe("queued");
      expect(progress.stylePreset).toBe("modern");
      expect(progress.progress.totalImages).toBe(1);
      expect(progress.progress.processedImages).toBe(0);
      expect(progress.progress.progressPercentage).toBe(0);
    });
  });

  describe("cancelStagingJob", () => {
    it("should cancel a queued job and refund credits", async () => {
      // Create test image and job
      const imageId = await t.mutation(api.images.createImageRecord, {
        projectId: t.projectId,
        imageKey: "test-image.jpg",
        filename: "living-room.jpg",
        fileSize: 1024 * 1024,
        contentType: "image/jpeg",
        dimensions: { width: 1920, height: 1080 },
        roomType: "living_room",
      });

      const jobId = await t.mutation(api.stagingJobs.createStagingJob, {
        projectId: t.projectId,
        imageIds: [imageId],
        stylePreset: "modern",
      });

      // Get user credits before cancellation
      const userBefore = await t.query(api.users.getCurrentUser, {});
      expect(userBefore.credits).toBe(9); // 10 - 1 used

      // Cancel job
      const result = await t.mutation(api.stagingJobs.cancelStagingJob, { jobId });
      expect(result.success).toBe(true);

      // Verify job status
      const job = await t.query(api.stagingJobs.getStagingJob, { jobId });
      expect(job.status).toBe("failed");

      // Verify credits were refunded
      const userAfter = await t.query(api.users.getCurrentUser, {});
      expect(userAfter.credits).toBe(10); // Credits restored
    });

    it("should not cancel completed jobs", async () => {
      // Create test image and job
      const imageId = await t.mutation(api.images.createImageRecord, {
        projectId: t.projectId,
        imageKey: "test-image.jpg",
        filename: "living-room.jpg",
        fileSize: 1024 * 1024,
        contentType: "image/jpeg",
        dimensions: { width: 1920, height: 1080 },
        roomType: "living_room",
      });

      const jobId = await t.mutation(api.stagingJobs.createStagingJob, {
        projectId: t.projectId,
        imageIds: [imageId],
        stylePreset: "modern",
      });

      // Mark job as completed
      await t.mutation(api.stagingJobs.updateStagingJobStatus, {
        jobId,
        status: "completed",
        completedAt: Date.now(),
      });

      // Try to cancel
      await expect(
        t.mutation(api.stagingJobs.cancelStagingJob, { jobId })
      ).rejects.toThrow("Cannot cancel completed or failed job");
    });
  });
});