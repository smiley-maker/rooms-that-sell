import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  stageImageWithGemini, 
  validateImageForStaging, 
  getStylePresets, 
  estimateProcessingTime,
  retryWithBackoff,
  type StylePreset 
} from "./gemini";

// Mock the Google AI SDK
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue("Mock staging description for the room")
        }
      })
    })
  }))
}));

// Mock the new Google GenAI SDK
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                data: "mock-base64-image-data",
                mimeType: "image/png"
              }
            }]
          }
        }]
      })
    }
  }))
}));

// Mock fetch for image fetching
global.fetch = vi.fn();

describe("Gemini AI Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful image fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/jpeg' : null
      }
    });
  });

  describe("stageImageWithGemini", () => {
    it("should successfully stage an image", async () => {
      const result = await stageImageWithGemini("https://example.com/image.jpg", {
        stylePreset: "modern",
        roomType: "living_room",
      });

      expect(result.success).toBe(true);
      expect(result.stagedImageUrl).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeDefined();
    });

    it("should handle invalid style preset", async () => {
      const result = await stageImageWithGemini("https://example.com/image.jpg", {
        stylePreset: "invalid" as StylePreset,
        roomType: "living_room",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid style preset");
    });

    it("should handle image fetch failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found"
      });

      const result = await stageImageWithGemini("https://example.com/nonexistent.jpg", {
        stylePreset: "modern",
        roomType: "living_room",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to fetch image");
    });

    it("should include custom prompt in staging", async () => {
      const result = await stageImageWithGemini("https://example.com/image.jpg", {
        stylePreset: "minimal",
        roomType: "bedroom",
        customPrompt: "Add a reading nook by the window",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("validateImageForStaging", () => {
    beforeEach(() => {
      // Mock validation response with proper JSON
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({
            response: {
              text: vi.fn().mockReturnValue(JSON.stringify({
                isValid: true,
                issues: [],
                confidence: 0.9,
                roomType: "living_room"
              }))
            }
          })
        })
      }));
    });

    it("should validate a suitable image", async () => {
      const result = await validateImageForStaging("https://example.com/room.jpg");

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should handle validation errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found"
      });

      const result = await validateImageForStaging("https://example.com/invalid.jpg");

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain("Failed to fetch image");
    });
  });

  describe("getStylePresets", () => {
    it("should return all available style presets", () => {
      const presets = getStylePresets();

      expect(presets).toHaveLength(5);
      expect(presets.map(p => p.id)).toContain("minimal");
      expect(presets.map(p => p.id)).toContain("scandinavian");
      expect(presets.map(p => p.id)).toContain("bohemian");
      expect(presets.map(p => p.id)).toContain("modern");
      expect(presets.map(p => p.id)).toContain("traditional");

      presets.forEach(preset => {
        expect(preset).toHaveProperty("id");
        expect(preset).toHaveProperty("name");
        expect(preset).toHaveProperty("description");
      });
    });
  });

  describe("estimateProcessingTime", () => {
    it("should return base time for small images", () => {
      const time = estimateProcessingTime(1024 * 1024, "living_room"); // 1MB
      expect(time).toBe(15000); // 15 seconds base time
    });

    it("should add time for large images", () => {
      const time = estimateProcessingTime(6 * 1024 * 1024, "living_room"); // 6MB
      expect(time).toBe(25000); // 15s base + 10s for large image
    });

    it("should add time for complex rooms", () => {
      const time = estimateProcessingTime(1024 * 1024, "kitchen"); // 1MB kitchen
      expect(time).toBe(20000); // 15s base + 5s for complex room
    });

    it("should combine adjustments", () => {
      const time = estimateProcessingTime(6 * 1024 * 1024, "bathroom"); // 6MB bathroom
      expect(time).toBe(30000); // 15s base + 10s large + 5s complex
    });
  });

  describe("retryWithBackoff", () => {
    it("should succeed on first try", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      
      const result = await retryWithBackoff(operation);
      
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error("Rate limit exceeded"))
        .mockResolvedValue("success");
      
      const result = await retryWithBackoff(operation, 2);
      
      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Invalid API key"));
      
      await expect(retryWithBackoff(operation, 2)).rejects.toThrow("Invalid API key");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should exhaust retries and throw last error", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Network timeout"));
      
      await expect(retryWithBackoff(operation, 2)).rejects.toThrow("Network timeout");
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});