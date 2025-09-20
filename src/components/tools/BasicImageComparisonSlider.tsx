"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BasicImageComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BasicImageComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Staged",
  className,
}: BasicImageComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isMobileSliderActive, setIsMobileSliderActive] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
    setLastInteractionTime(Date.now());
  }, []);

  useEffect(() => {
    if (isHovering || isDragging || isMobileSliderActive) return;

    const timeSinceLastInteraction = Date.now() - lastInteractionTime;
    if (timeSinceLastInteraction < 1000) return;

    const startPosition = position;
    const targetPosition = 50;
    const startTime = Date.now();
    const duration = 800;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentPosition = startPosition + (targetPosition - startPosition) * easedProgress;
      setPosition(currentPosition);

      if (progress < 1 && !isHovering && !isDragging && !isMobileSliderActive) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isHovering, isDragging, isMobileSliderActive, lastInteractionTime, position]);

  useEffect(() => {
    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  const renderImage = useCallback((src: string, alt: string) => {
    if (!src) return null;

    // Prefer native <img> to gracefully support blob/data URLs without Next config.
    return (
      <img
        key={src}
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full select-none object-cover"
        draggable={false}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 bg-transparent select-none shadow-lg cursor-col-resize"
        onMouseDown={(event) => {
          setIsDragging(true);
          updatePosition(event.clientX);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={(event) => {
          updatePosition(event.clientX);
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setIsDragging(false);
          setLastInteractionTime(Date.now());
        }}
        onTouchStart={(event) => {
          setIsDragging(true);
          updatePosition(event.touches[0].clientX);
        }}
        onTouchEnd={() => {
          setIsDragging(false);
          setLastInteractionTime(Date.now());
        }}
        onTouchMove={(event) => {
          if (!isDragging) return;
          updatePosition(event.touches[0].clientX);
        }}
        aria-label="Before and after comparison"
      >
        <div className="absolute inset-0">
          <div className="relative h-full w-full">
            {renderImage(beforeImage, beforeLabel)}
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
              {beforeLabel}
            </div>
          </div>
        </div>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <div className="relative h-full w-full">
            {renderImage(afterImage, afterLabel)}
            <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-green-600 px-3 py-1 text-sm font-medium text-white">
              {afterLabel}
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
          style={{ left: `${position}%` }}
        >
          <div
            className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-neutral-900 shadow-lg pointer-events-auto"
          >
            <div className="h-6 w-1 rounded-full bg-gray-400" />
          </div>
        </div>
      </div>

      <div className="mt-4 md:hidden">
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(event) => {
            setPosition(Number(event.target.value));
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
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${position}%, #e5e7eb ${position}%, #e5e7eb 100%)`,
          }}
          aria-label="Compare before and after"
        />
        <div className="mt-1 flex justify-between text-xs text-neutral-600">
          <span>{beforeLabel}</span>
          <span>{afterLabel}</span>
        </div>
      </div>
    </div>
  );
}
