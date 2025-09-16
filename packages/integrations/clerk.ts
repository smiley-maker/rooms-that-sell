import { z } from "zod";
import { withRetry } from "@/lib/retry";

// Minimal typed wrappers for Clerk REST calls if needed in Actions (server-side)
// In this codebase, most Clerk interactions happen via middleware/hooks, so keep light.

const UserId = z.string().min(1);

export async function getUser(userId: string) {
  const id = UserId.parse(userId);
  // Placeholder for server-side user fetch via Clerk REST if needed
  return withRetry(async () => {
    // Implement if server-side fetch is required; otherwise rely on ctx.auth in Convex
    return { id } as const;
  });
}


