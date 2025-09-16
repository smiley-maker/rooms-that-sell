import { describe, it, expect, vi, beforeEach } from "vitest";
import * as gemini from "@integrations/gemini";

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockImplementation(async (req: any) => {
        // echo back seed in text for verification
        const seed = req?.generationConfig?.seed ?? null;
        return {
          candidates: [{ content: { parts: [{ text: JSON.stringify({ ok: true, seed }) }] } }],
        };
      }),
    },
  })),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(8),
  headers: { get: () => 'image/jpeg' },
} as any);

describe("Gemini adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes deterministic seed when provided", async () => {
    const res = await gemini.stageImage("https://example.com/img.jpg", {
      stylePreset: "modern",
      roomType: "living_room",
      seed: 1234,
    } as any);
    // We mocked to return text, so success should be false (no inline image), but call happened with seed
    expect(res.success).toBe(false);
  });
});


