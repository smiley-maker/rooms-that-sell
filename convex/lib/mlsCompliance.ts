
/**
 * MLS Compliance utilities for virtual staging
 * Ensures all staged images meet MLS requirements and industry standards
 */

export interface WatermarkOptions {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
}

export interface ComplianceValidation {
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
  confidence: number;
}

export interface ExportOptions {
  includeOriginal: boolean;
  includeStaged: boolean;
  resolutions: Array<{
    name: string;
    width: number;
    height: number;
  }>;
  watermark: WatermarkOptions;
}

/**
 * Default watermark configuration for MLS compliance
 */
export const DEFAULT_WATERMARK: WatermarkOptions = {
  text: "Virtually Staged",
  position: 'bottom-right',
  opacity: 0.8,
  fontSize: 24,
  color: '#FFFFFF',
};

/**
 * Standard MLS export resolutions
 */
export const MLS_EXPORT_RESOLUTIONS = [
  { name: 'MLS Standard', width: 1024, height: 768 },
  { name: 'MLS Large', width: 1200, height: 800 },
  { name: 'High Resolution', width: 1920, height: 1080 },
  { name: 'Ultra High', width: 2560, height: 1440 },
];

/**
 * Apply watermark to a base64 image using Canvas API
 */
export async function applyWatermark(
  imageDataUrl: string,
  options: WatermarkOptions = DEFAULT_WATERMARK
): Promise<string> {
  try {
    // Import canvas for server-side image processing
    const { createCanvas, loadImage } = await import('canvas');
    
    // Load the original image
    const img = await loadImage(imageDataUrl);
    
    // Create canvas with same dimensions
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Configure watermark text
    ctx.font = `${options.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = options.color;
    ctx.globalAlpha = options.opacity;
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    
    // Measure text dimensions
    const textMetrics = ctx.measureText(options.text);
    const textWidth = textMetrics.width;
    const textHeight = options.fontSize;
    
    // Calculate position based on option
    let x: number, y: number;
    const padding = 20;
    
    switch (options.position) {
      case 'top-left':
        x = padding;
        y = padding + textHeight;
        break;
      case 'top-right':
        x = img.width - textWidth - padding;
        y = padding + textHeight;
        break;
      case 'bottom-left':
        x = padding;
        y = img.height - padding;
        break;
      case 'bottom-right':
        x = img.width - textWidth - padding;
        y = img.height - padding;
        break;
      case 'center':
        x = (img.width - textWidth) / 2;
        y = (img.height + textHeight) / 2;
        break;
      default:
        x = img.width - textWidth - padding;
        y = img.height - padding;
    }
    
    // Draw the watermark text
    ctx.fillText(options.text, x, y);
    
    // Convert back to data URL
    return canvas.toDataURL('image/jpeg', 0.9);
    
  } catch (error) {
    console.error('Failed to apply watermark:', error);
    // Return original image if watermarking fails
    return imageDataUrl;
  }
}

/**
 * Validate structural preservation in staged images
 */
export async function validateStructuralPreservation(
  originalImageUrl: string,
  stagedImageUrl: string
): Promise<ComplianceValidation> {
  try {
    // Import Gemini for AI-based validation
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Fetch both images
    const [originalResponse, stagedResponse] = await Promise.all([
      fetch(originalImageUrl),
      fetch(stagedImageUrl)
    ]);

    if (!originalResponse.ok || !stagedResponse.ok) {
      throw new Error('Failed to fetch images for validation');
    }

    // Convert to base64
    const [originalBuffer, stagedBuffer] = await Promise.all([
      originalResponse.arrayBuffer(),
      stagedResponse.arrayBuffer()
    ]);

    const originalBase64 = arrayBufferToBase64(originalBuffer);
    const stagedBase64 = arrayBufferToBase64(stagedBuffer);
    const mimeType = originalResponse.headers.get('content-type') || 'image/jpeg';

    const validationPrompt = `Compare these two images for MLS compliance in virtual staging. The first image is the original empty room, and the second is the virtually staged version.

CRITICAL MLS REQUIREMENTS TO CHECK:
1. Structural elements MUST be preserved (walls, windows, doors, floors, ceilings)
2. Room layout and dimensions MUST remain unchanged
3. Architectural features MUST not be altered or hidden
4. Only furniture and decor should be added, nothing structural removed or modified
5. Lighting and perspective should be consistent

ANALYZE FOR VIOLATIONS:
- Are any walls, windows, or doors altered?
- Has the room layout or size been changed?
- Are any structural elements hidden or removed?
- Has the flooring type or pattern been changed?
- Are ceiling features preserved?

Respond with a JSON object:
{
  "isCompliant": boolean,
  "violations": ["list of serious MLS violations"],
  "warnings": ["list of minor concerns"],
  "confidence": number (0-1),
  "structuralChanges": ["list of detected structural changes"],
  "preservedElements": ["list of properly preserved elements"]
}`;

    const result = await model.generateContent([
      { text: validationPrompt },
      {
        inlineData: {
          data: originalBase64,
          mimeType: mimeType,
        },
      },
      {
        inlineData: {
          data: stagedBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const validation = JSON.parse(cleanText);
      
      return {
        isCompliant: validation.isCompliant || false,
        violations: validation.violations || [],
        warnings: validation.warnings || [],
        confidence: validation.confidence || 0,
      };
    } catch {
      console.error('Failed to parse validation response:', text);
      return {
        isCompliant: false,
        violations: ['Failed to validate structural preservation'],
        warnings: [],
        confidence: 0,
      };
    }

  } catch (error) {
    console.error('Structural validation error:', error);
    return {
      isCompliant: false,
      violations: ['Validation failed due to technical error'],
      warnings: [],
      confidence: 0,
    };
  }
}

/**
 * Generate MLS-compliant export package
 */
export async function generateMLSExportPackage(
  originalImageUrl: string,
  stagedImageUrl: string,
  options: ExportOptions
): Promise<{
  success: boolean;
  exports: Array<{
    type: 'original' | 'staged';
    resolution: string;
    dataUrl: string;
    filename: string;
  }>;
  error?: string;
}> {
  try {
    const exports = [];

    // Process original image if requested
    if (options.includeOriginal && originalImageUrl) {
      for (const resolution of options.resolutions) {
        try {
          const resizedImage = await resizeImage(originalImageUrl, resolution.width, resolution.height);
          exports.push({
            type: 'original' as const,
            resolution: resolution.name,
            dataUrl: resizedImage,
            filename: `original_${resolution.name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          });
        } catch (error) {
          console.error(`Failed to resize original image to ${resolution.name}:`, error);
        }
      }
    }

    // Process staged image if requested
    if (options.includeStaged && stagedImageUrl) {
      for (const resolution of options.resolutions) {
        try {
          // First resize the staged image
          const resizedImage = await resizeImage(stagedImageUrl, resolution.width, resolution.height);
          
          // Then apply watermark
          const watermarkedImage = await applyWatermark(resizedImage, options.watermark);
          
          exports.push({
            type: 'staged' as const,
            resolution: resolution.name,
            dataUrl: watermarkedImage,
            filename: `staged_${resolution.name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          });
        } catch (error) {
          console.error(`Failed to process staged image for ${resolution.name}:`, error);
        }
      }
    }

    return {
      success: true,
      exports,
    };

  } catch (error) {
    console.error('Export package generation failed:', error);
    return {
      success: false,
      exports: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resize image to specified dimensions while maintaining aspect ratio
 */
export async function resizeImage(
  imageDataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  try {
    const { createCanvas, loadImage } = await import('canvas');
    
    // Load the original image
    const img = await loadImage(imageDataUrl);
    
    // Calculate dimensions maintaining aspect ratio
    const aspectRatio = img.width / img.height;
    const targetAspectRatio = targetWidth / targetHeight;
    
    let newWidth: number, newHeight: number;
    
    if (aspectRatio > targetAspectRatio) {
      // Image is wider than target
      newWidth = targetWidth;
      newHeight = targetWidth / aspectRatio;
    } else {
      // Image is taller than target
      newHeight = targetHeight;
      newWidth = targetHeight * aspectRatio;
    }
    
    // Create canvas with target dimensions
    const canvas = createCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // Center the image
    const x = (targetWidth - newWidth) / 2;
    const y = (targetHeight - newHeight) / 2;
    
    // Draw the resized image
    ctx.drawImage(img, x, y, newWidth, newHeight);
    
    return canvas.toDataURL('image/jpeg', 0.9);
    
  } catch (error) {
    console.error('Failed to resize image:', error);
    // Return original if resize fails
    return imageDataUrl;
  }
}

/**
 * Check MLS compliance for a staged image
 */
export async function checkMLSCompliance(
  originalImageUrl: string,
  stagedImageUrl: string
): Promise<{
  isCompliant: boolean;
  score: number;
  violations: string[];
  warnings: string[];
  recommendations: string[];
}> {
  try {
    // Validate structural preservation
    const structuralValidation = await validateStructuralPreservation(originalImageUrl, stagedImageUrl);
    
    // Additional compliance checks
    const violations = [...structuralValidation.violations];
    const warnings = [...structuralValidation.warnings];
    const recommendations = [];
    
    // Check if watermark is needed (for staged images)
    if (stagedImageUrl && !stagedImageUrl.includes('Virtually Staged')) {
      warnings.push('Staged image should include "Virtually Staged" watermark for MLS compliance');
      recommendations.push('Add watermark to clearly identify virtually staged content');
    }
    
    // Calculate compliance score
    let score = 100;
    score -= violations.length * 25; // Major violations
    score -= warnings.length * 10;  // Minor issues
    score = Math.max(0, score);
    
    const isCompliant = violations.length === 0 && score >= 80;
    
    return {
      isCompliant,
      score,
      violations,
      warnings,
      recommendations,
    };
    
  } catch (error) {
    console.error('MLS compliance check failed:', error);
    return {
      isCompliant: false,
      score: 0,
      violations: ['Compliance check failed due to technical error'],
      warnings: [],
      recommendations: ['Please retry compliance validation'],
    };
  }
}

/**
 * Utility function to convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

/**
 * Get MLS compliance guidelines
 */
export function getMLSComplianceGuidelines(): {
  requirements: string[];
  bestPractices: string[];
  commonViolations: string[];
} {
  return {
    requirements: [
      'All structural elements must be preserved (walls, windows, doors, floors)',
      'Room layout and dimensions cannot be altered',
      'Only furniture and decor may be added, no structural changes',
      'Staged images must be clearly watermarked as "Virtually Staged"',
      'Both original and staged versions should be available',
      'Images must maintain realistic lighting and perspective',
    ],
    bestPractices: [
      'Use subtle, professional watermarks in bottom-right corner',
      'Maintain consistent style across all rooms in a listing',
      'Ensure furniture scale is appropriate for room size',
      'Use neutral, appealing color schemes',
      'Avoid over-staging that looks unrealistic',
      'Provide multiple resolution options for different uses',
    ],
    commonViolations: [
      'Altering wall colors or finishes',
      'Changing flooring materials or patterns',
      'Removing or modifying windows and doors',
      'Changing room layout or adding/removing walls',
      'Missing or inadequate watermarking',
      'Unrealistic furniture placement or scale',
    ],
  };
}