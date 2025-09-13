"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Always call useUser hook (required by React rules)
  const { isSignedIn, user } = useUser();
  
  // Handle hydration to prevent SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <nav className="px-6 py-4 bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => scrollToSection('hero')}
          className="cursor-pointer hover:scale-105 transition-transform"
        >
          <Image
            src="/images/roomsthatselllogo.png"
            alt="Rooms That Sell"
            width={150}
            height={50}
            className="h-12 w-auto"
            priority
          />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:scale-105">features</button>
          <button onClick={() => scrollToSection('examples')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:scale-105">examples</button>
          <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:scale-105">pricing</button>
          <button onClick={() => scrollToSection('faqs')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:scale-105">faq</button>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          {mounted && isSignedIn ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
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
          ) : mounted ? (
            <div className="hidden md:flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer hover:scale-105 px-4 py-2">
                  sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
                >
                  get started
                </button>
              </SignUpButton>
            </div>
          ) : (
            // Placeholder during SSR
            <div className="hidden md:flex items-center gap-3">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`w-full h-0.5 bg-gray-600 transition-all ${isMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></span>
              <span className={`w-full h-0.5 bg-gray-600 transition-all mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
          <div className="flex flex-col gap-4 pt-4">
            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer hover:scale-105">features</button>
            <button onClick={() => scrollToSection('examples')} className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer hover:scale-105">examples</button>
            <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer hover:scale-105">pricing</button>
            <button onClick={() => scrollToSection('faqs')} className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer hover:scale-105">faq</button>
            
            {mounted && isSignedIn ? (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
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
            ) : mounted ? (
              <div className="flex flex-col gap-3 pt-2">
                <SignInButton mode="modal">
                  <button className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer hover:scale-105">
                    sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button 
                    className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:scale-105 cursor-pointer w-fit"
                    style={{ backgroundColor: "var(--brand-primary)" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
                  >
                    get started
                  </button>
                </SignUpButton>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}