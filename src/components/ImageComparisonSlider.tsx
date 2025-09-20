"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Id } from "../../convex/_generated/dataModel";
import { ImageDisplay } from "./ImageDisplay";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

// ImageComparisonSlider component - based on the landing page BeforeAfterSlider with improvements
interface ImageComparisonSliderProps {
  imageId: Id<"images">;
  originalUrl?: string;
  stagedUrl?: string | null;
  className?: string;
}

export function ImageComparisonSlider({ 
  imageId, 
  stagedUrl, 
  className,
}: ImageComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isMobileSliderActive, setIsMobileSliderActive] = useState(false);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  const objectFitClass =
    className?.match(/object-(contain|cover|fill|none|scale-down)/)?.[0] ||
    "object-contain";

  // Load both original and staged image URLs
  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      // Reset state when imageId changes to prevent flashing
      setImagesLoaded(false);
      setIsLoading(true);
      setBeforeImageUrl(null);
      setAfterImageUrl(null);
      
      try {
        // Load original image
        const originalUrl = await getImageDownloadUrl({ 
          imageId, 
          isStaged: false 
        });
        
        if (mounted) {
          setBeforeImageUrl(originalUrl);
        }
      } catch (err) {
        console.error("Failed to load original image:", err);
      }

      // Load staged image if available
      if (stagedUrl) {
        try {
          const stagedImageUrl = await getImageDownloadUrl({ 
            imageId, 
            isStaged: true 
          });
          
          if (mounted) {
            setAfterImageUrl(stagedImageUrl);
          }
        } catch (err) {
          console.error("Failed to load staged image:", err);
        }
      }

      if (mounted) {
        setIsLoading(false);
        // Use a small delay to ensure images are ready before showing
        setTimeout(() => {
          if (mounted) {
            setImagesLoaded(true);
          }
        }, 100);
      }
    };

    loadImages();

    return () => {
      mounted = false;
    };
  }, [imageId, stagedUrl, getImageDownloadUrl]);

  // Smooth easing back to center when not hovering (but not on mobile slider interaction)
  useEffect(() => {
    if (isHovering || isDragging || isMobileSliderActive) return;

    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    // Only start easing after 1 second of no interaction
    if (timeSinceLastInteraction < 1000) return;

    const startPosition = position;
    const targetPosition = 50;
    const startTime = Date.now();
    const duration = 800; // 800ms easing animation

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      const currentPosition = startPosition + (targetPosition - startPosition) * easedProgress;
      setPosition(currentPosition);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isHovering, isDragging, isMobileSliderActive, lastInteractionTime, position]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  // Desktop: Follow mouse on hover (no dragging required)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
    setLastInteractionTime(Date.now());
  };

  // Mobile: Keep original touch behavior for dragging
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
    setLastInteractionTime(Date.now());
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    handleMouseUp();
    setLastInteractionTime(Date.now());
  };

  // If no staged image, show original only
  if (!stagedUrl) {
    return (
      <div className={`relative ${className}`}>
        <ImageDisplay
          imageId={imageId}
          isStaged={false}
          className="w-full h-full"
          alt="Original image"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-sm font-medium">Original Only</div>
            <div className="text-xs opacity-75">No staged version available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Loading skeleton */}
      {(!imagesLoaded || isLoading) && (
        <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-200 animate-pulse transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
          <div className="absolute top-4 left-4 bg-gray-400 px-3 py-1 rounded-full text-sm font-medium w-16 h-6"></div>
          <div className="absolute top-4 right-4 bg-gray-400 px-3 py-1 rounded-full text-sm font-medium w-12 h-6"></div>
        </div>
      )}
      
      {/* Before/After Images */}
      <div 
        className={cn(
          "relative w-full h-full overflow-hidden rounded-xl cursor-col-resize select-none transition-opacity duration-500",
          imagesLoaded && !isLoading ? 'opacity-100' : 'opacity-0 absolute'
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
        aria-label="Before and after virtual staging slider"
      >
        {/* Before Image (Original) */}
        {beforeImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={beforeImageUrl}
              alt="Original image"
              fill
              className={objectFitClass}
              onLoad={() => console.log("Before image loaded")}
              onError={(e) => console.error("Error loading before image:", beforeImageUrl, e)}
              unoptimized
            />
            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
              Original
            </div>
          </div>
        )}

        {/* After Image (Staged) */}
        {afterImageUrl && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <Image
              src={afterImageUrl}
              alt="Staged image"
              fill
              className={objectFitClass}
              onLoad={() => console.log("After image loaded")}
              onError={(e) => console.error("Error loading after image:", afterImageUrl, e)}
              unoptimized
            />
            <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Staged
            </div>
          </div>
        )}

        {/* Drag Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
          style={{ left: `${position}%` }}
        >
          {/* Drag Handle */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 cursor-col-resize pointer-events-auto flex items-center justify-center"
            onMouseDown={handleMouseDown}
          >
            <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Mobile Slider Input */}
      <div className="md:hidden mt-4">
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => {
            setPosition(Number(e.target.value));
            setLastInteractionTime(Date.now());
          }}
          onTouchStart={() => setIsMobileSliderActive(true)}
          onTouchEnd={() => {
            setIsMobileSliderActive(false);
            setLastInteractionTime(Date.now());
          }}
          onMouseDown={() => setIsMobileSliderActive(true)}
          onMouseUp={() => {
            setIsMobileSliderActive(false);
            setLastInteractionTime(Date.now());
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${position}%, #e5e7eb ${position}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Original</span>
          <span>Staged</span>
        </div>
      </div>
    </div>
  );
}
