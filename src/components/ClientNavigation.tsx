"use client";

import dynamic from 'next/dynamic';

// Dynamically import Navigation with no SSR to prevent useUser hook issues during build
const Navigation = dynamic(() => import('./Navigation').then(mod => ({ default: mod.Navigation })), {
  ssr: false,
  loading: () => (
    <nav className="px-6 py-4 bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="hidden md:flex items-center gap-8">
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </nav>
  )
});

export { Navigation as ClientNavigation };