import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_WATERMARK,
  MLS_EXPORT_RESOLUTIONS,
  getMLSComplianceGuidelines,
} from './mlsCompliance';

// Mock the canvas module
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => ({
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillRect: vi.fn(),
      set font(value: string) {},
      set fillStyle(value: string) {},
      set globalAlpha(value: number) {},
      set shadowColor(value: string) {},
      set shadowOffsetX(value: number) {},
      set shadowOffsetY(value: number) {},
      set shadowBlur(value: number) {},
    })),
    toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
  })),
  loadImage: vi.fn(() => Promise.resolve({
    width: 1024,
    height: 768,
  })),
}));

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(() => Promise.resolve({
        response: {
          text: () => JSON.stringify({
            isCompliant: true,
            violations: [],
            warnings: [],
            confidence: 0.9,
          }),
        },
      })),
    })),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('MLS Compliance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DEFAULT_WATERMARK', () => {
    it('should have correct default watermark settings', () => {
      expect(DEFAULT_WATERMARK).toEqual({
        text: 'Virtually Staged',
        position: 'bottom-right',
        opacity: 0.8,
        fontSize: 24,
        color: '#FFFFFF',
      });
    });
  });

  describe('MLS_EXPORT_RESOLUTIONS', () => {
    it('should include standard MLS resolutions', () => {
      expect(MLS_EXPORT_RESOLUTIONS).toContainEqual({
        name: 'MLS Standard',
        width: 1024,
        height: 768,
      });
      
      expect(MLS_EXPORT_RESOLUTIONS).toContainEqual({
        name: 'MLS Large',
        width: 1200,
        height: 800,
      });
    });

    it('should have at least 4 resolution options', () => {
      expect(MLS_EXPORT_RESOLUTIONS.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getMLSComplianceGuidelines', () => {
    it('should return comprehensive guidelines', () => {
      const guidelines = getMLSComplianceGuidelines();
      
      expect(guidelines).toHaveProperty('requirements');
      expect(guidelines).toHaveProperty('bestPractices');
      expect(guidelines).toHaveProperty('commonViolations');
      
      expect(Array.isArray(guidelines.requirements)).toBe(true);
      expect(Array.isArray(guidelines.bestPractices)).toBe(true);
      expect(Array.isArray(guidelines.commonViolations)).toBe(true);
      
      expect(guidelines.requirements.length).toBeGreaterThan(0);
      expect(guidelines.bestPractices.length).toBeGreaterThan(0);
      expect(guidelines.commonViolations.length).toBeGreaterThan(0);
    });

    it('should include key MLS requirements', () => {
      const guidelines = getMLSComplianceGuidelines();
      
      const requirementsText = guidelines.requirements.join(' ').toLowerCase();
      expect(requirementsText).toContain('structural');
      expect(requirementsText).toContain('watermark');
      expect(requirementsText).toContain('virtually staged');
    });
  });

  describe('applyWatermark', () => {
    it('should apply watermark with default settings', async () => {
      const { applyWatermark } = await import('./mlsCompliance');
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        headers: {
          get: () => 'image/jpeg',
        },
      });

      const result = await applyWatermark('data:image/jpeg;base64,test');
      
      expect(result).toBe('data:image/jpeg;base64,mockdata');
    });

    it('should handle watermark application errors gracefully', async () => {
      const { applyWatermark } = await import('./mlsCompliance');
      
      // Mock canvas error
      const { createCanvas } = await import('canvas');
      (createCanvas as any).mockImplementationOnce(() => {
        throw new Error('Canvas error');
      });

      const originalImage = 'data:image/jpeg;base64,test';
      const result = await applyWatermark(originalImage);
      
      // Should return original image on error
      expect(result).toBe(originalImage);
    });
  });

  describe('validateStructuralPreservation', () => {
    it('should validate structural preservation between images', async () => {
      const { validateStructuralPreservation } = await import('./mlsCompliance');
      
      // Mock successful fetch for both images
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        });

      const result = await validateStructuralPreservation(
        'https://example.com/original.jpg',
        'https://example.com/staged.jpg'
      );

      expect(result).toHaveProperty('isCompliant');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('confidence');
      
      expect(typeof result.isCompliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.confidence).toBe('number');
    });

    it('should handle fetch errors gracefully', async () => {
      const { validateStructuralPreservation } = await import('./mlsCompliance');
      
      // Mock fetch failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await validateStructuralPreservation(
        'https://example.com/original.jpg',
        'https://example.com/staged.jpg'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('Validation failed due to technical error');
    });
  });

  describe('checkMLSCompliance', () => {
    it('should perform comprehensive compliance check', async () => {
      const { checkMLSCompliance } = await import('./mlsCompliance');
      
      // Mock successful fetch for both images
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        });

      const result = await checkMLSCompliance(
        'https://example.com/original.jpg',
        'https://example.com/staged.jpg'
      );

      expect(result).toHaveProperty('isCompliant');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.isCompliant).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should detect missing watermark', async () => {
      const { checkMLSCompliance } = await import('./mlsCompliance');
      
      // Mock successful fetch for both images
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          headers: { get: () => 'image/jpeg' },
        });

      const result = await checkMLSCompliance(
        'https://example.com/original.jpg',
        'https://example.com/staged-no-watermark.jpg'
      );

      const warningsText = result.warnings.join(' ').toLowerCase();
      expect(warningsText).toContain('watermark');
    });
  });

  describe('generateMLSExportPackage', () => {
    it('should generate export package with multiple resolutions', async () => {
      const { generateMLSExportPackage } = await import('./mlsCompliance');
      
      const exportOptions = {
        includeOriginal: true,
        includeStaged: true,
        resolutions: MLS_EXPORT_RESOLUTIONS.slice(0, 2),
        watermark: DEFAULT_WATERMARK,
      };

      const result = await generateMLSExportPackage(
        'data:image/jpeg;base64,original',
        'data:image/jpeg;base64,staged',
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.exports).toBeDefined();
      expect(result.exports.length).toBe(4); // 2 resolutions × 2 types
      
      // Check export structure
      const firstExport = result.exports[0];
      expect(firstExport).toHaveProperty('type');
      expect(firstExport).toHaveProperty('resolution');
      expect(firstExport).toHaveProperty('dataUrl');
      expect(firstExport).toHaveProperty('filename');
    });

    it('should handle export generation errors', async () => {
      const { generateMLSExportPackage } = await import('./mlsCompliance');
      
      const exportOptions = {
        includeOriginal: true,
        includeStaged: false,
        resolutions: MLS_EXPORT_RESOLUTIONS.slice(0, 1),
        watermark: DEFAULT_WATERMARK,
      };

      // Test with invalid image data that should cause processing to fail
      const result = await generateMLSExportPackage(
        '', // Empty string should cause error
        '',
        exportOptions
      );

      // The function should still succeed but with empty exports due to error handling
      expect(result.success).toBe(true);
      expect(result.exports.length).toBe(0);
    });
  });

  describe('resizeImage', () => {
    it('should resize image maintaining aspect ratio', async () => {
      const { resizeImage } = await import('./mlsCompliance');
      
      const result = await resizeImage('data:image/jpeg;base64,test', 800, 600);
      
      expect(result).toBe('data:image/jpeg;base64,mockdata');
    });

    it('should handle resize errors gracefully', async () => {
      const { resizeImage } = await import('./mlsCompliance');
      
      // Mock canvas error
      const { createCanvas } = await import('canvas');
      (createCanvas as any).mockImplementationOnce(() => {
        throw new Error('Canvas error');
      });

      const originalImage = 'data:image/jpeg;base64,test';
      const result = await resizeImage(originalImage, 800, 600);
      
      // Should return original image on error
      expect(result).toBe(originalImage);
    });
  });
});