import { describe, it, expect, vi } from "vitest";
import * as r2 from "@integrations/r2";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://acc.r2.cloudflarestorage.com/bucket/key"),
}));

describe("R2 adapter", () => {
  it("presignPut returns a URL and echoes bucket", async () => {
    const { url, bucket } = await r2.presignPut({ key: "key", contentType: "image/jpeg", bucket: "bucket" });
    expect(url).toContain("r2.cloudflarestorage.com");
    expect(bucket).toBe("bucket");
  });
});


