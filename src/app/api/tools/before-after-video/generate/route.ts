import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../../convex/_generated/api";

const PayloadSchema = z.object({
  before: z.object({ key: z.string(), bucket: z.string() }),
  after: z.object({ key: z.string(), bucket: z.string() }),
  filenames: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
    })
    .optional(),
  toolSlug: z.string().min(1),
});

function getClientIp(request: Request) {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const clientIp = forwarded.split(",").map((ip) => ip.trim()).find(Boolean);
    if (clientIp) return clientIp;
  }
  const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
  if (realIp) return realIp;
  // In local dev, fall back to loopback
  return "127.0.0.1";
}

function hashIp(ip: string) {
  const salt = process.env.BEFORE_AFTER_TOOL_SALT || "rooms-that-sell";
  return createHash("sha256").update(ip + salt).digest("hex");
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = PayloadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
    }

    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ message: "Server not configured." }, { status: 500 });
    }

    const ipAddress = getClientIp(request);
    const client = new ConvexHttpClient(convexUrl);
    const hashedIp = hashIp(ipAddress);

    const response = await client.action(api.beforeAfterVideos.generateVideo, {
      before: parsed.data.before,
      after: parsed.data.after,
      filenames: parsed.data.filenames,
      toolSlug: parsed.data.toolSlug,
      ipHash: hashedIp,
      sourceIp: ipAddress,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = /limit/i.test(message) ? 429 : 500;
    return NextResponse.json({ message }, { status });
  }
}
