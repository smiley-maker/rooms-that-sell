import { GoogleGenAI } from "@google/genai";
import { withAIRetry, CircuitBreaker } from "@/lib/retry";
import { z } from "zod";

export type StylePreset = keyof typeof STYLE_PRESETS;

export interface StagingOptions {
  stylePreset: StylePreset;
  roomType: string;
  customPrompt?: string;
  seed?: number;
}

export interface StagingResult {
  success: boolean;
  stagedImageUrl?: string;
  error?: string;
  processingTime: number;
  confidence?: number;
}

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

export function getStylePresets() {
  return Object.entries(STYLE_PRESETS).map(([key, config]) => ({
    id: key as StylePreset,
    name: config.name,
    description: config.description,
  }));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Prefer web btoa if present
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const btoaFn = (globalThis as { btoa?: (s: string) => string }).btoa;
  if (typeof btoaFn === "function") {
    return btoaFn(binary);
  }
  // Node Buffer fallback if available
  const BufferCtor = (globalThis as {
    Buffer?: { from(input: Uint8Array): { toString(encoding: "base64"): string } };
  }).Buffer;
  if (BufferCtor) {
    return BufferCtor.from(bytes).toString("base64");
  }
  // Minimal manual base64 fallback
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let output = "";
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++] ?? 0;
    const b2 = bytes[i++] ?? 0;
    const b3 = bytes[i++] ?? 0;
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    let enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    let enc4 = b3 & 63;
    if (i - 1 > bytes.length) {
      enc3 = 64;
      enc4 = 64;
    } else if (i > bytes.length) {
      enc4 = 64;
    }
    output +=
      chars.charAt(enc1) +
      chars.charAt(enc2) +
      chars.charAt(enc3) +
      chars.charAt(enc4);
  }
  return output;
}

// Zod schemas
const stagingOptionsSchema = z.object({
  stylePreset: z.custom<StylePreset>((val) => typeof val === "string" && val in STYLE_PRESETS, {
    message: "Invalid style preset",
  }),
  roomType: z.string().min(1),
  customPrompt: z.string().optional(),
  seed: z.number().int().optional(),
});

const urlSchema = z.string().url();

function buildStagingPrompt(options: StagingOptions): string {
  const styleConfig = STYLE_PRESETS[options.stylePreset];
  return `Transform this empty ${options.roomType} into a beautifully staged space using ${styleConfig.name.toLowerCase()} style.

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
}

const breaker = new CircuitBreaker(5, 60000);

export async function stageImage(
  imageUrl: string,
  options: StagingOptions
): Promise<StagingResult> {
  const startTime = Date.now();

  return withAIRetry(async () => {
    // Validate inputs
    urlSchema.parse(imageUrl);
    const parsed = stagingOptionsSchema.parse(options);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Fetch original image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let imageBase64: string;
    let mimeType: string;

    try {
      const res = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'RoomsThatSell/1.0' },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 20 * 1024 * 1024) throw new Error("Image too large (max 20MB)");
      imageBase64 = arrayBufferToBase64(buf);
      mimeType = res.headers.get('content-type') || 'image/jpeg';
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }

    const contents = [
      { text: buildStagingPrompt(options) },
      { inlineData: { mimeType, data: imageBase64 } },
    ];

    const params: {
      model: string;
      contents: Array<{ text?: string } | { inlineData?: { mimeType: string; data: string } }>;
      generationConfig?: { seed: number };
    } = {
      model: "gemini-2.5-flash-image-preview",
      contents,
    };
    if (parsed.seed !== undefined) {
      params.generationConfig = { seed: parsed.seed };
    }

    const response = await breaker.execute(() => ai.models.generateContent(params));

    const processingTime = Date.now() - startTime;

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const stagedData = part.inlineData.data;
          const stagedMime = part.inlineData.mimeType || 'image/png';
          return {
            success: true,
            stagedImageUrl: `data:${stagedMime};base64,${stagedData}`,
            processingTime,
            confidence: 0.9,
          };
        }
      }
    }

    return { success: false, error: "No image was generated by the AI model", processingTime };
  });
}

export async function validateImage(imageUrl: string): Promise<{
  isValid: boolean;
  issues: string[];
  confidence: number;
}> {
  urlSchema.parse(imageUrl);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const res = await fetch(imageUrl);
  if (!res.ok) {
    return { isValid: false, issues: ["Failed to fetch image"], confidence: 0 };
  }

  const buf = await res.arrayBuffer();
  const imageBase64 = arrayBufferToBase64(buf);
  const mimeType = res.headers.get('content-type') || 'image/jpeg';

  const prompt = `Analyze this room image for virtual staging suitability. Check for:

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: [
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType } },
    ],
  });

  let text = "";
  if (response.candidates && response.candidates.length > 0) {
    const parts = response.candidates[0].content?.parts || [];
    for (const part of parts) {
      if (part.text) text += part.text;
    }
  }

  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) clean = clean.replace(/```json\n?/, '').replace(/\n?```$/, '');
    else if (clean.startsWith('```')) clean = clean.replace(/```\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(clean);
    return {
      isValid: parsed.isValid || false,
      issues: parsed.issues || [],
      confidence: parsed.confidence || 0,
    };
  } catch {
    return { isValid: false, issues: ["Failed to analyze image"], confidence: 0 };
  }
}


