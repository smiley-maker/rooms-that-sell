import { describe, it, expect } from 'vitest';
import {
  parseFilenameForRoomType,
  analyzeStructuralFeatures,
  detectRoomType,
  getFallbackSuggestions,
  isValidRoomType,
  getRoomTypeDisplayName,
  getRoomTypeOptions
} from './roomTypeDetection';

describe('Room Type Detection', () => {
  describe('parseFilenameForRoomType', () => {
    it('should detect kitchen from filename', () => {
      const result = parseFilenameForRoomType('kitchen_photo.jpg');
      expect(result.roomType).toBe('kitchen');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect master bedroom from filename', () => {
      const result = parseFilenameForRoomType('master_bedroom_1.jpg');
      expect(result.roomType).toBe('master_bedroom');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should detect living room from filename', () => {
      const result = parseFilenameForRoomType('living_room_wide.png');
      expect(result.roomType).toBe('living_room');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle unknown room types', () => {
      const result = parseFilenameForRoomType('random_image.jpg');
      expect(result.roomType).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should provide suggestions for detected room types', () => {
      const result = parseFilenameForRoomType('kitchen_counter.jpg');
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].roomType).toBe('kitchen');
    });
  });

  describe('analyzeStructuralFeatures', () => {
    it('should detect kitchen features', () => {
      const result = analyzeStructuralFeatures('IMG_1234.jpg', {
        description: 'Beautiful granite countertop with stainless steel appliances',
        tags: ['counter', 'stove', 'cabinet']
      });
      expect(result.roomType).toBe('kitchen');
      expect(result.detectedFeatures).toContain('countertop');
      expect(result.detectedFeatures).toContain('appliances');
    });

    it('should detect bathroom features', () => {
      const result = analyzeStructuralFeatures('bathroom_pic.jpg', {
        description: 'Modern bathroom with shower and vanity',
        tags: ['toilet', 'shower']
      });
      expect(result.roomType).toBe('bathroom');
      expect(result.detectedFeatures).toContain('toilet');
      expect(result.detectedFeatures).toContain('shower');
    });

    it('should handle no structural features', () => {
      const result = analyzeStructuralFeatures('empty_room.jpg');
      expect(result.roomType).toBe('unknown');
      expect(result.detectedFeatures).toHaveLength(0);
    });
  });

  describe('detectRoomType', () => {
    it('should combine filename and structural analysis', () => {
      const result = detectRoomType('kitchen_remodel.jpg', {
        description: 'New granite countertops installed',
        tags: ['granite', 'cabinet']
      });
      expect(result.roomType).toBe('kitchen');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should prefer high-confidence filename matches', () => {
      const result = detectRoomType('master_bedroom_final.jpg', {
        description: 'Room with desk and computer',
        tags: ['desk']
      });
      // Should prefer master_bedroom from filename over office from structural features
      expect(result.roomType).toBe('master_bedroom');
    });

    it('should provide multiple suggestions', () => {
      const result = detectRoomType('room_with_bed.jpg');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getFallbackSuggestions', () => {
    it('should provide common room types as fallbacks', () => {
      const suggestions = getFallbackSuggestions('random_file.jpg');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.roomType === 'living_room')).toBe(true);
      expect(suggestions.some(s => s.roomType === 'kitchen')).toBe(true);
    });

    it('should suggest room types for generic room references', () => {
      const suggestions = getFallbackSuggestions('empty_room_photo.jpg');
      expect(suggestions.some(s => s.roomType === 'living_room')).toBe(true);
    });
  });

  describe('utility functions', () => {
    it('should validate room types correctly', () => {
      expect(isValidRoomType('kitchen')).toBe(true);
      expect(isValidRoomType('living_room')).toBe(true);
      expect(isValidRoomType('invalid_room')).toBe(false);
    });

    it('should return correct display names', () => {
      expect(getRoomTypeDisplayName('kitchen')).toBe('Kitchen');
      expect(getRoomTypeDisplayName('living_room')).toBe('Living Room');
      expect(getRoomTypeDisplayName('master_bedroom')).toBe('Master Bedroom');
      expect(getRoomTypeDisplayName('unknown_type')).toBe('Unknown');
    });

    it('should return room type options for UI', () => {
      const options = getRoomTypeOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('label');
    });
  });

  describe('edge cases', () => {
    it('should handle filenames with numbers and special characters', () => {
      const result = parseFilenameForRoomType('IMG_2024-01-15_kitchen_001.JPG');
      expect(result.roomType).toBe('kitchen');
    });

    it('should handle mixed case filenames', () => {
      const result = parseFilenameForRoomType('MASTER_BEDROOM_Photo.PNG');
      expect(result.roomType).toBe('master_bedroom');
    });

    it('should handle filenames with hyphens and underscores', () => {
      const result = parseFilenameForRoomType('living-room_wide-angle.webp');
      expect(result.roomType).toBe('living_room');
    });

    it('should handle empty or undefined metadata', () => {
      const result = analyzeStructuralFeatures('test.jpg', undefined);
      expect(result).toBeDefined();
      expect(result.roomType).toBe('unknown');
    });
  });
});