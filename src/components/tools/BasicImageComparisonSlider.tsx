"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
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

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-900 select-none"
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
        <Image
          src={beforeImage}
          alt={beforeLabel}
          fill
          unoptimized
          className="pointer-events-none select-none object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={afterImage}
            alt={afterLabel}
            fill
            unoptimized
            className="pointer-events-none select-none object-cover"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-between px-6 text-sm font-semibold uppercase tracking-[0.2em] text-white drop-shadow">
          <span className="rounded-full bg-neutral-900/70 px-3 py-1 backdrop-blur">{beforeLabel}</span>
          <span className="rounded-full bg-neutral-900/70 px-3 py-1 backdrop-blur">{afterLabel}</span>
        </div>

        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-xl"
          style={{ left: `${position}%` }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-neutral-900 shadow-lg">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase">
              <span>⇤</span>
              <span>⇥</span>
            </div>
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
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20"
          style={{
            background: `linear-gradient(to right, rgba(59,130,246,1) 0%, rgba(59,130,246,1) ${position}%, rgba(255,255,255,0.2) ${position}%, rgba(255,255,255,0.2) 100%)`,
          }}
          aria-label="Compare before and after"
        />
        <div className="mt-1 flex justify-between text-xs uppercase tracking-wide text-white/60">
          <span>{beforeLabel}</span>
          <span>{afterLabel}</span>
        </div>
      </div>
    </div>
  );
}
