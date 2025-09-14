"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login/signup UI for unauthenticated users
  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to RoomsThatSell
            </h1>
            <p className="mt-2 text-gray-600">
              Please sign in to access your dashboard
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign In to Continue</CardTitle>
              <CardDescription>
                Access your virtual staging dashboard and manage your projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignInButton mode="modal">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
              
              <SignUpButton mode="modal">
                <button className="w-full bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors">
                  Create Account
                </button>
              </SignUpButton>
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-gray-600">
            <p>
              Join thousands of real estate agents using our MLS-compliant virtual staging platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
