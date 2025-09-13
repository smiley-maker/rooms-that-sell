import { describe, it, expect } from "vitest";
import { validateIntegrationSetup, getIntegrationStatus } from "./staging_demo";

describe("Gemini Integration Status", () => {
  describe("validateIntegrationSetup", () => {
    it("should validate the integration setup", () => {
      const validation = validateIntegrationSetup();
      
      expect(validation).toHaveProperty("isValid");
      expect(validation).toHaveProperty("issues");
      expect(validation).toHaveProperty("recommendations");
      
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
      expect(validation.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getIntegrationStatus", () => {
    it("should return comprehensive integration status", () => {
      const status = getIntegrationStatus();
      
      expect(status).toHaveProperty("status");
      expect(status).toHaveProperty("geminiApiConfigured");
      expect(status).toHaveProperty("stylePresetsAvailable");
      expect(status).toHaveProperty("features");
      expect(status).toHaveProperty("validation");
      
      // Check features
      expect(status.features.imageValidation).toBe(true);
      expect(status.features.retryLogic).toBe(true);
      expect(status.features.batchProcessing).toBe(true);
      expect(status.features.progressTracking).toBe(true);
      expect(status.features.errorHandling).toBe(true);
      expect(status.features.stylePresets).toHaveLength(5);
      
      // Check style presets
      const expectedStyles = ["minimal", "scandinavian", "bohemian", "modern", "traditional"];
      expectedStyles.forEach(style => {
        expect(status.features.stylePresets).toContain(style);
      });
    });
  });
});