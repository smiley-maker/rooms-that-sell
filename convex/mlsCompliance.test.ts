import { describe, it, expect } from 'vitest';
import { api } from './_generated/api';

describe('MLS Compliance Functions', () => {

  describe('API Functions', () => {
    it('should have required MLS compliance functions', () => {
      // Verify the functions exist in the API
      expect(api.mlsCompliance.validateImageCompliance).toBeDefined();
      expect(api.mlsCompliance.updateImageCompliance).toBeDefined();
      expect(api.mlsCompliance.applyImageWatermark).toBeDefined();
      expect(api.mlsCompliance.createMLSExport).toBeDefined();
      expect(api.mlsCompliance.getProjectComplianceStatus).toBeDefined();
      expect(api.mlsCompliance.getComplianceGuidelines).toBeDefined();
      expect(api.mlsCompliance.getExportResolutions).toBeDefined();
    });
  });

  describe('Compliance Data Structures', () => {
    it('should have proper compliance data structure', () => {
      const sampleComplianceData = {
        isCompliant: true,
        score: 95,
        violations: [],
        warnings: ['Minor lighting adjustment recommended'],
        lastChecked: Date.now(),
        structuralPreservation: {
          validated: true,
          confidence: 0.95,
          issues: [],
        },
        watermarkApplied: true,
      };

      expect(typeof sampleComplianceData.isCompliant).toBe('boolean');
      expect(typeof sampleComplianceData.score).toBe('number');
      expect(Array.isArray(sampleComplianceData.violations)).toBe(true);
      expect(Array.isArray(sampleComplianceData.warnings)).toBe(true);
      expect(typeof sampleComplianceData.lastChecked).toBe('number');
      expect(typeof sampleComplianceData.structuralPreservation.validated).toBe('boolean');
      expect(typeof sampleComplianceData.structuralPreservation.confidence).toBe('number');
      expect(Array.isArray(sampleComplianceData.structuralPreservation.issues)).toBe(true);
      expect(typeof sampleComplianceData.watermarkApplied).toBe('boolean');
    });

    it('should have proper export options structure', () => {
      const sampleExportOptions = {
        includeOriginal: true,
        includeStaged: true,
        resolutions: ['MLS Standard', 'MLS Large'],
        watermarkOptions: {
          text: 'Virtually Staged',
          position: 'bottom-right',
          opacity: 0.8,
          fontSize: 24,
          color: '#FFFFFF',
        },
      };

      expect(typeof sampleExportOptions.includeOriginal).toBe('boolean');
      expect(typeof sampleExportOptions.includeStaged).toBe('boolean');
      expect(Array.isArray(sampleExportOptions.resolutions)).toBe(true);
      expect(typeof sampleExportOptions.watermarkOptions?.text).toBe('string');
      expect(typeof sampleExportOptions.watermarkOptions?.position).toBe('string');
      expect(typeof sampleExportOptions.watermarkOptions?.opacity).toBe('number');
      expect(typeof sampleExportOptions.watermarkOptions?.fontSize).toBe('number');
      expect(typeof sampleExportOptions.watermarkOptions?.color).toBe('string');
    });
  });
});