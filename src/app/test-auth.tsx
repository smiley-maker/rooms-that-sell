"use client";

import { useUser } from "@/hooks/useUser";
import { SignInButton, SignOutButton } from "@clerk/nextjs";

export default function TestAuth() {
  const { clerkUser, convexUser, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="p-4">
        <h1>Authentication Test</h1>
        <p>Please sign in to test the authentication integration.</p>
        <SignInButton mode="modal">
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Authentication Test - Success!</h1>
      
      <div className="mt-4">
        <h2>Clerk User Data:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify({
            id: clerkUser?.id,
            email: clerkUser?.emailAddresses[0]?.emailAddress,
            firstName: clerkUser?.firstName,
            lastName: clerkUser?.lastName,
          }, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <h2>Convex User Data:</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(convexUser, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <SignOutButton>
          <button className="bg-red-500 text-white px-4 py-2 rounded">
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}