"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/toast-provider";

// Handle test environment where CONVEX_URL might not be set
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://test.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

export function Providers({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // In test environment, provide a minimal wrapper
  if (!clerkPublishableKey || process.env.NODE_ENV === "test") {
    return (
      <div data-testid="providers-wrapper">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ToastProvider />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignUpUrl="/dashboard"
        afterSignInUrl="/dashboard"
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
      <ToastProvider />
    </ErrorBoundary>
  );
}