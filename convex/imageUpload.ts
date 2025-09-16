"use node";

/**
 * Upload staged image to R2 storage
 */
import { logger } from "./lib/logger";
import { putObject } from "@integrations/r2";

export async function uploadStagedImageToR2(dataUrl: string, key: string): Promise<string> {
  // Convert data URL to buffer - handle Buffer availability
  const [header, base64Data] = dataUrl.split(',');
  const mimeMatch = header?.match(/^data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  let buffer: Buffer | Uint8Array;
  
  if (typeof Buffer !== 'undefined') {
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    buffer = bytes;
  }
  
  if (buffer.length > 1024 * 1024) {
    logger.debug("imageUpload: large staged buffer", { mb: Number((buffer.length / 1024 / 1024).toFixed(2)) });
  }
  
  const bucket = process.env.R2_BUCKET_STAGED;
  if (!bucket) {
    logger.error("imageUpload: missing R2_BUCKET_STAGED env");
    throw new Error("R2 staged bucket not configured (R2_BUCKET_STAGED)");
  }
  return putObject({ key, body: buffer, contentType: mimeType, bucket });
}
