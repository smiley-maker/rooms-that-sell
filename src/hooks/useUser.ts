"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useUser() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const createUser = useMutation(api.users.createUser);
  const updateLastActive = useMutation(api.users.updateLastActive);
  
  // Get user from Convex database
  const convexUser = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  // Sync user data when Clerk user is loaded
  useEffect(() => {
    if (isClerkLoaded && clerkUser && !convexUser) {
      // Create user in Convex if they don't exist
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        createUser({
          clerkId: clerkUser.id,
          email: email,
          plan: "trial",
        }).catch(console.error);
      }
    } else if (isClerkLoaded && clerkUser && convexUser) {
      // Update last active time
      updateLastActive({
        clerkId: clerkUser.id,
      }).catch(console.error);
    }
  }, [isClerkLoaded, clerkUser, convexUser, createUser, updateLastActive]);

  return {
    clerkUser,
    convexUser,
    isLoaded: isClerkLoaded && (convexUser !== undefined || !clerkUser),
    isSignedIn: !!clerkUser,
  };
}