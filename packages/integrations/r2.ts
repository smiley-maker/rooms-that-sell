import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { withRetry } from "@/lib/retry";
import { z } from "zod";

export interface PresignPutParams {
  key: string;
  contentType: string;
  expiresIn?: number;
  bucket?: string;
  metadata?: Record<string, string>;
}

export interface PresignGetParams {
  key: string;
  expiresIn?: number;
  bucket?: string;
}

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

// Zod schemas for input validation
const keySchema = z.string().min(1);
const bucketSchema = z.string().min(1);
const contentTypeSchema = z.string().min(1);
const expiresInSchema = z.number().int().positive().max(7 * 24 * 60 * 60).optional(); // up to 7 days
const metadataSchema = z.record(z.string(), z.string()).optional();

const presignPutSchema = z.object({
  key: keySchema,
  contentType: contentTypeSchema,
  expiresIn: expiresInSchema,
  bucket: bucketSchema.optional(),
  metadata: metadataSchema,
});

const presignGetSchema = z.object({
  key: keySchema,
  expiresIn: expiresInSchema,
  bucket: bucketSchema.optional(),
});

export async function presignPut(params: PresignPutParams): Promise<{ url: string; bucket: string }> {
  const parsed = presignPutSchema.parse(params);
  const bucket = parsed.bucket ?? process.env.R2_BUCKET_OG!;
  const client = getClient();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: parsed.key,
    ContentType: parsed.contentType,
    Metadata: parsed.metadata as Record<string, string> | undefined,
  });
  const url = await withRetry(() => getSignedUrl(client, cmd, { expiresIn: parsed.expiresIn ?? 3600 }));
  return { url, bucket };
}

export async function presignGet(params: PresignGetParams): Promise<{ url: string; bucket: string }> {
  const parsed = presignGetSchema.parse(params);
  const bucket = parsed.bucket ?? process.env.R2_BUCKET_OG!;
  const client = getClient();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: parsed.key });
  const url = await withRetry(() => getSignedUrl(client, cmd, { expiresIn: parsed.expiresIn ?? 3600 }));
  return { url, bucket };
}

export async function putObject(params: { bucket?: string; key: string; body: Buffer | Uint8Array; contentType: string }) {
  // Validate critical parts
  keySchema.parse(params.key);
  contentTypeSchema.parse(params.contentType);
  const bucket = params.bucket ?? process.env.R2_BUCKET_STAGED!;
  const client = getClient();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: params.key, Body: params.body, ContentType: params.contentType });
  await withRetry(() => client.send(cmd));
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}/${params.key}`;
}

