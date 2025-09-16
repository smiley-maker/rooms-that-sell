"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Home, FolderOpen, Menu, X, CreditCard } from "lucide-react";
import { Suspense } from "react";
import { CreditStatus } from "./CreditStatus";

function AuthenticatedNavbarContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigation = [
    { name: "Dashboard", href: "/projects", icon: FolderOpen },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Landing Page", href: "/?view=landing", icon: Home },
  ];

  const isActive = (href: string) => {
    if (href === "/projects") {
      return pathname === "/projects" || pathname.startsWith("/projects/");
    }
    if (href === "/?view=landing") {
      return pathname === "/" && searchParams.get("view") === "landing";
    }
    return pathname === href;
  };

  return (
    <nav className="bg-white rounded-full sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/projects" className="hover:scale-105 transition-transform">
                <Image
                  src="/images/roomsthatselllogo.png"
                  alt="Rooms That Sell"
                  width={150}
                  height={50}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2 lg:space-x-4">
            <div className="hidden lg:block">
              <CreditStatus showUpgradePrompt={false} />
            </div>
            <span className="hidden md:block text-sm text-gray-600 truncate max-w-32 lg:max-w-none">
              Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}!
            </span>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 space-y-3">
              <div className="flex items-center space-x-3">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-medium text-gray-800 truncate">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user?.emailAddresses[0]?.emailAddress}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <CreditStatus showUpgradePrompt={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export function AuthenticatedNavbar() {
  return (
    <Suspense fallback={
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    }>
      <AuthenticatedNavbarContent />
    </Suspense>
  );
}