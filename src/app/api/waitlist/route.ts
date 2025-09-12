import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const WaitlistSchema = z.object({
  email: z.string().email(),
  listingsPerMonth: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = WaitlistSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);
    await client.mutation(api.waitlist.join, {
      email: parsed.data.email,
      listingsPerMonth: parsed.data.listingsPerMonth,
      source: parsed.data.source || "landing",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


