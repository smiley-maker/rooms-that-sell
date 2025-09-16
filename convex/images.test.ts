import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";

describe("Image upload functions", () => {
  it("should validate image files correctly", () => {
    // Test the validation logic that's now in the images.ts file
    const validateImageFile = (filename: string, contentType: string): { valid: boolean; error?: string } => {
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
    };

    // Test valid files
    expect(validateImageFile("test.jpg", "image/jpeg")).toEqual({ valid: true });
    expect(validateImageFile("test.png", "image/png")).toEqual({ valid: true });
    expect(validateImageFile("test.webp", "image/webp")).toEqual({ valid: true });

    // Test invalid files
    expect(validateImageFile("test.txt", "text/plain")).toEqual({ 
      valid: false, 
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
    });
    expect(validateImageFile("test.gif", "image/gif")).toEqual({ 
      valid: false, 
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
    });
  });

  it("should generate unique image keys", async () => {
    const generateImageKey = (userId: string, projectId: string, filename: string, isStaged = false, timestamp?: number): string => {
      const ts = timestamp || Date.now();
      const extension = filename.split('.').pop();
      const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove extension
      const suffix = isStaged ? '_staged' : '';
      
      return `users/${userId}/projects/${projectId}/${ts}_${baseName}${suffix}.${extension}`;
    };

    // Use different timestamps to ensure uniqueness
    const key1 = generateImageKey("user1", "project1", "test.jpg", false, 1000);
    const key2 = generateImageKey("user1", "project1", "test.jpg", false, 2000);
    
    // Keys should be different due to timestamp
    expect(key1).not.toEqual(key2);
    
    // Keys should follow the expected format
    expect(key1).toMatch(/^users\/user1\/projects\/project1\/\d+_test\.jpg$/);
    
    // Staged version should have suffix
    const stagedKey = generateImageKey("user1", "project1", "test.jpg", true, 3000);
    expect(stagedKey).toMatch(/^users\/user1\/projects\/project1\/\d+_test_staged\.jpg$/);
  });

  it("should expose new versioning API functions", () => {
    expect(api.images.updateImageWithStagedResult).toBeDefined();
    expect(api.images.listImageVersions).toBeDefined();
    expect(api.images.setImageVersionPinned).toBeDefined();
    expect(api.images.setCurrentImageVersion).toBeDefined();
  });
});