"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function TestIntegration() {
  // Test that we can query the waitlist count (this verifies Convex connection)
  const waitlistCount = useQuery(api.waitlist.count);

  return (
    <div className="p-4">
      <h1>Integration Test</h1>
      <div className="mt-4">
        <h2>Convex Connection Test:</h2>
        <p>
          Waitlist count: {waitlistCount !== undefined ? waitlistCount : "Loading..."}
        </p>
        {waitlistCount !== undefined && (
          <p className="text-green-600">✅ Convex connection working!</p>
        )}
      </div>
    </div>
  );
}