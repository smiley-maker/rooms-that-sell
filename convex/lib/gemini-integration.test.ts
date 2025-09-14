import { describe, it, expect } from "vitest";
import { 
  getStylePresets, 
  estimateProcessingTime,
  type StylePreset 
} from "./gemini";

describe("Gemini Integration - Core Functions", () => {
  describe("getStylePresets", () => {
    it("should return all 5 style presets", () => {
      const presets = getStylePresets();
      
      expect(presets).toHaveLength(5);
      
      const expectedStyles = ["minimal", "scandinavian", "bohemian", "modern", "traditional"];
      const actualStyles = presets.map(p => p.id);
      
      expectedStyles.forEach(style => {
        expect(actualStyles).toContain(style);
      });
      
      presets.forEach(preset => {
        expect(preset).toHaveProperty("id");
        expect(preset).toHaveProperty("name");
        expect(preset).toHaveProperty("description");
        expect(typeof preset.id).toBe("string");
        expect(typeof preset.name).toBe("string");
        expect(typeof preset.description).toBe("string");
      });
    });
  });

  describe("estimateProcessingTime", () => {
    it("should calculate processing time correctly", () => {
      // Small image, simple room
      expect(estimateProcessingTime(1024 * 1024, "living_room")).toBe(15000);
      
      // Large image (6MB), simple room
      expect(estimateProcessingTime(6 * 1024 * 1024, "living_room")).toBe(25000);
      
      // Small image, complex room
      expect(estimateProcessingTime(1024 * 1024, "kitchen")).toBe(20000);
      
      // Large image, complex room
      expect(estimateProcessingTime(6 * 1024 * 1024, "bathroom")).toBe(30000);
    });
  });
});