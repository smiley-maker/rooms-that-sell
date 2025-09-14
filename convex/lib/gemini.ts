import { GoogleGenAI } from "@google/genai";

// Using the modern @google/genai SDK for all Gemini calls

// Style preset configurations for virtual staging
const STYLE_PRESETS = {
  minimal: {
    name: "Minimal",
    description: "Clean, uncluttered spaces with neutral colors and simple furniture",
    prompt: "Stage this room with minimal, clean furniture and decor. Use neutral colors like white, beige, and light gray. Keep furniture simple and uncluttered. Focus on functionality and open space. Add only essential pieces that enhance the room's natural light and spaciousness.",
  },
  scandinavian: {
    name: "Scandinavian",
    description: "Light woods, cozy textures, and functional design",
    prompt: "Stage this room in Scandinavian style with light wood furniture, cozy textiles, and functional design. Use a palette of whites, light grays, and natural wood tones. Add hygge elements like soft throws, simple lighting, and plants. Keep the design clean but warm and inviting.",
  },
  bohemian: {
    name: "Bohemian",
    description: "Eclectic mix of patterns, textures, and warm colors",
    prompt: "Stage this room in bohemian style with an eclectic mix of patterns, textures, and warm colors. Include vintage or antique-looking furniture, colorful textiles, plants, and artistic elements. Use rich colors like deep blues, warm oranges, and earthy tones. Create a cozy, lived-in feeling.",
  },
  modern: {
    name: "Modern",
    description: "Contemporary furniture with clean lines and bold accents",
    prompt: "Stage this room with modern, contemporary furniture featuring clean lines and geometric shapes. Use a sophisticated color palette with bold accent pieces. Include sleek furniture, modern art, and statement lighting. Balance neutral tones with pops of color through accessories.",
  },
  traditional: {
    name: "Traditional",
    description: "Classic furniture with timeless appeal and rich materials",
    prompt: "Stage this room with traditional, classic furniture and timeless design elements. Use rich materials like wood and leather, elegant fabrics, and classic patterns. Include traditional furniture pieces, warm lighting, and sophisticated accessories. Create a refined, established atmosphere.",
  },
} as const;

export type StylePreset = keyof typeof STYLE_PRESETS;

export interface StagingOptions {
  stylePreset: StylePreset;
  roomType: string;
  customPrompt?: string;
}

export interface StagingResult {
  success: boolean;
  stagedImageUrl?: string;
  error?: string;
  processingTime: number;
  confidence?: number;
}

/**
 * Convert ArrayBuffer to base64 string (Convex-compatible)
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

/**
 * Stage an image using Gemini 2.5 Flash Image model for actual image generation
 */
export async function stageImageWithGemini(
  imageUrl: string,
  options: StagingOptions
): Promise<StagingResult> {
  const startTime = Date.now();

  try {
    // Validate style preset
    if (!STYLE_PRESETS[options.stylePreset]) {
      throw new Error(`Invalid style preset: ${options.stylePreset}`);
    }

    // Initialize the Gemini client with timeout configuration
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // Fetch the original image data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let imageBase64: string;
    let mimeType: string;
    
    try {
      const imageResponse = await fetch(imageUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'RoomsThatSell/1.0'
        }
      });
      clearTimeout(timeoutId);
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = arrayBufferToBase64(imageBuffer);
      mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      // Validate image size (max 20MB)
      if (imageBuffer.byteLength > 20 * 1024 * 1024) {
        throw new Error("Image too large (max 20MB)");
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error("Image fetch timeout");
      }
      throw error;
    }

    // Build the staging prompt for image generation
    const styleConfig = STYLE_PRESETS[options.stylePreset];
    const stagingPrompt = `Transform this empty ${options.roomType} into a beautifully staged space using ${styleConfig.name.toLowerCase()} style.

STAGING REQUIREMENTS:
- Preserve all architectural elements (walls, windows, doors, floors, ceilings)
- Add appropriate furniture and decor for a ${options.roomType.replace('_', ' ')}
- Use ${styleConfig.name.toLowerCase()} design principles
- Maintain the exact room layout and camera perspective
- Ensure realistic lighting and shadows
- Create a professional real estate staging look

STYLE DETAILS:
${styleConfig.prompt}

${options.customPrompt ? `ADDITIONAL REQUIREMENTS: ${options.customPrompt}` : ''}

Generate a high-quality, professionally staged version of this room that would appeal to potential buyers or renters.`;

    console.log(`Generating staged image with Gemini 2.5 Flash Image for ${options.roomType} in ${styleConfig.name} style`);

    // Generate the staged image using Gemini 2.5 Flash Image
    // Use the exact format from the working example
    const prompt = [
      { text: stagingPrompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64,
        },
      },
    ];

    // Add timeout wrapper for Gemini API call
    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Gemini API timeout")), 120000); // 2 minute timeout
    });
    
    const response = await Promise.race([geminiPromise, timeoutPromise]) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data: string; mimeType?: string };
            text?: string;
          }>;
        };
      }>;
    };

    const processingTime = Date.now() - startTime;

    // Process the response to extract the generated image
    // Following the exact structure from the working example
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check if we got an image back
          if (part.inlineData && part.inlineData.data) {
            console.log(`Successfully generated staged image in ${processingTime}ms`);
            
            // Convert the base64 image data to a data URL
            const stagedImageData = part.inlineData.data;
            const stagedMimeType = part.inlineData.mimeType || 'image/png';
            const stagedImageUrl = `data:${stagedMimeType};base64,${stagedImageData}`;

            return {
              success: true,
              stagedImageUrl,
              processingTime,
              confidence: 0.9, // High confidence for actual AI generation
            };
          }
          
          // Log any text response for debugging
          if (part.text) {
            console.log("Gemini text response:", part.text);
          }
        }
      }
    }

    // If we didn't get an image, treat it as a failure
    const { logger } = await import("../lib/logger");
    logger.warn("gemini.stage: no image generated");
    return {
      success: false,
      error: "No image was generated by the AI model",
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const { logger } = await import("../lib/logger");
    logger.error("gemini.stage: error", { error: error instanceof Error ? error.message : String(error) });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      processingTime,
    };
  }
}

/**
 * Validate if an image is suitable for staging using Gemini 2.0 Flash (text model)
 */
export async function validateImageForStaging(imageUrl: string): Promise<{
  isValid: boolean;
  issues: string[];
  confidence: number;
}> {
  try {
    // Use the text model for validation (more reliable for analysis)
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return {
        isValid: false,
        issues: ["Failed to fetch image"],
        confidence: 0,
      };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const validationPrompt = `Analyze this room image for virtual staging suitability. Check for:

1. Is this an interior room photo?
2. Is the room mostly empty or sparsely furnished?
3. Are the walls, floors, and structural elements clearly visible?
4. Is the image quality sufficient (not blurry, well-lit)?
5. Is the room a suitable size for staging (not a closet or tiny space)?

Respond with a JSON object containing:
- isValid: boolean
- issues: array of strings describing any problems
- confidence: number between 0-1 indicating suitability
- roomType: detected room type (living room, bedroom, kitchen, etc.)

Example response:
{
  "isValid": true,
  "issues": [],
  "confidence": 0.9,
  "roomType": "living room"
}`;

    const validationResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        { text: validationPrompt },
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
      ],
    });

    let text = "";
    if (validationResponse.candidates && validationResponse.candidates.length > 0) {
      const parts = validationResponse.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          text += part.text;
        }
      }
    }

    // Parse the JSON response (handle markdown code blocks)
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const validation = JSON.parse(cleanText);
      return {
        isValid: validation.isValid || false,
        issues: validation.issues || [],
        confidence: validation.confidence || 0,
      };
    } catch {
      console.error("Failed to parse validation response:", text);
      return {
        isValid: false,
        issues: ["Failed to analyze image"],
        confidence: 0,
      };
    }

  } catch (error) {
    console.error("Image validation error:", error);
    return {
      isValid: false,
      issues: ["Validation failed"],
      confidence: 0,
    };
  }
}

/**
 * Get available style presets
 */
export function getStylePresets() {
  return Object.entries(STYLE_PRESETS).map(([key, config]) => ({
    id: key as StylePreset,
    name: config.name,
    description: config.description,
  }));
}

/**
 * Estimate processing time based on image size and complexity
 */
export function estimateProcessingTime(imageSize: number, roomType: string): number {
  // Base processing time in milliseconds
  let baseTime = 15000; // 15 seconds

  // Adjust based on image size (larger images take longer)
  if (imageSize > 5 * 1024 * 1024) { // > 5MB
    baseTime += 10000;
  } else if (imageSize > 2 * 1024 * 1024) { // > 2MB
    baseTime += 5000;
  }

  // Adjust based on room complexity
  const complexRooms = ['kitchen', 'bathroom', 'office'];
  if (complexRooms.includes(roomType.toLowerCase())) {
    baseTime += 5000;
  }

  return baseTime;
}

/**
 * Retry configuration for AI processing
 */
// Deprecated local retry config; use shared retry in adapters
// Deprecated retry config removed; use shared retry in adapters

/**
 * Retry wrapper for AI operations with exponential backoff
 */
// Deprecated: use withAIRetry in packages/integrations
// Removed deprecated retryWithBackoff; use withAIRetry in adapters

/**
 * Check if an error is retryable
 */
// Removed unused isRetryableError (moved to shared retry utils)

/**
 * Enhanced staging function with retry logic
 */
// Deprecated: use stageImage from packages/integrations/gemini
// Removed deprecated stageImageWithGeminiRetry; import stageImage from @integrations/gemini instead

/**
 * Batch staging with concurrency control
 */
export async function stageImagesInBatch(
  images: Array<{ url: string; options: StagingOptions }>,
  concurrency = 3
): Promise<StagingResult[]> {
  const results: StagingResult[] = [];
  
  // Process images in batches to avoid overwhelming the API
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async ({ url, options }) => {
      try {
        return await stageImageWithGemini(url, options);
      } catch (error) {
        console.error(`Failed to stage image ${url}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          processingTime: 0,
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches to be respectful to the API
    if (i + concurrency < images.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}