"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Star, Users, Clock, Shield, Camera, Download, Palette, Upload, Home as HomeIcon, Badge } from "lucide-react";
import { ProblemVsSolution, CoreFeatures3Up } from "@/components";

// Colors now come from CSS variables in globals.css
// Access via var(--brand-primary), var(--brand-accent), etc.

function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * (end - start) + start));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration, start]);

  return { count, ref: elementRef };
}

function AnimatedCounter({ 
  end, 
  suffix = "", 
  prefix = "", 
  className = "",
  duration = 2000 
}: { 
  end: number; 
  suffix?: string; 
  prefix?: string; 
  className?: string;
  duration?: number;
}) {
  const { count, ref } = useCountUp(end, duration);
  
  return (
    <div ref={ref} className={className}>
      {prefix}{count}{suffix}
    </div>
  );
}


function BeforeAfterSlider({ 
  beforeImage = "/images/emptyroom.jpg", 
  afterImage = "/images/stagedroom.png",
  beforeAlt = "Empty room before staging",
  afterAlt = "Staged room after virtual staging",
  beforeLabel = "Before",
  afterLabel = "After",
  priority = false
}: {
  beforeImage?: string;
  afterImage?: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  priority?: boolean;
}) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = [beforeImage, afterImage].map(src => {
        return new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        });
      });
      
      try {
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.warn('Failed to preload some images:', error);
        setImagesLoaded(true); // Still show images even if preload fails
      }
    };

    preloadImages();
  }, [beforeImage, afterImage]);

  // Smooth easing back to center when not hovering
  useEffect(() => {
    if (isHovering || isDragging) return;

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
  }, [isHovering, isDragging, lastInteractionTime, position]);

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

  return (
    <div className="relative w-full">
      {/* Loading skeleton */}
      {!imagesLoaded && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
          <div className="absolute top-4 left-4 bg-gray-400 px-3 py-1 rounded-full text-sm font-medium w-16 h-6"></div>
          <div className="absolute top-4 right-4 bg-gray-400 px-3 py-1 rounded-full text-sm font-medium w-12 h-6"></div>
        </div>
      )}
      
      {/* Before/After Images */}
      <div 
        className={`relative aspect-[4/3] overflow-hidden rounded-xl cursor-col-resize select-none transition-opacity duration-300 ${imagesLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
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
        {/* Before Image (Empty Room) */}
        <div className="absolute inset-0">
          <Image
            src={beforeImage}
            alt={beforeAlt}
            fill
            className="object-cover"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Staged Room) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={afterImage}
            alt={afterAlt}
            fill
            className="object-cover"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {afterLabel}
          </div>
        </div>

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
          onChange={(e) => setPosition(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, var(--brand-primary) 0%, var(--brand-primary) ${position}%, #e5e7eb ${position}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{beforeLabel}</span>
          <span>{afterLabel}</span>
        </div>
      </div>
    </div>
  );
}

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => scrollToSection('waitlist')}
            className="hidden md:inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
            style={{ backgroundColor: "var(--brand-primary)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
          >
            sign up for waitlist
          </button>
          
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
            <button 
              onClick={() => scrollToSection('waitlist')}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:scale-105 cursor-pointer w-fit"
              style={{ backgroundColor: "var(--brand-primary)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
            >
              sign up for waitlist
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [listings, setListings] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isYearly, setIsYearly] = useState(false);

  // Pricing logic - 2 months free when paid yearly (10/12 of annual price)
  const pricingPlans = {
    agent: {
      monthly: 29,
      yearlyMonthly: Math.round((29 * 10) / 12), // $24 per month when billed annually
      yearlyTotal: 29 * 10, // $290 billed annually
      images: 100,
      perImage: isYearly ? (29 * 10) / 12 / 100 : 29 / 100
    },
    pro: {
      monthly: 49,
      yearlyMonthly: Math.round((49 * 10) / 12), // $41 per month when billed annually  
      yearlyTotal: 49 * 10, // $490 billed annually
      images: 300,
      perImage: isYearly ? (49 * 10) / 12 / 300 : 49 / 300
    },
    business: {
      monthly: 129,
      yearlyMonthly: Math.round((129 * 10) / 12), // $108 per month when billed annually
      yearlyTotal: 129 * 10, // $1290 billed annually
      images: 800,
      perImage: isYearly ? (129 * 10) / 12 / 800 : 129 / 800
    }
  };


  // Batch Upload Demo State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<Record<number, 'queued' | 'processing' | 'complete'>>({});

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  // Batch Upload Animation Function
  const startBatchUploadDemo = () => {
    if (isUploading) return; // Prevent multiple simultaneous demos
    
    setIsUploading(true);
    setUploadProgress(0);
    setCompletedFiles(0);
    setFileStatuses({});
    
    const fileNames = [
      'kitchen_1.jpg', 'living_room_1.jpg', 'master_bedroom.jpg', 'dining_room.jpg',
      'bathroom_1.jpg', 'bedroom_2.jpg', 'basement.jpg', 'home_office.jpg',
      'kitchen_2.jpg', 'living_room_2.jpg', 'bathroom_2.jpg', 'bedroom_3.jpg',
      'exterior_front.jpg', 'backyard.jpg', 'garage.jpg', 'laundry_room.jpg',
      'hallway.jpg', 'entryway.jpg'
    ];
    
    const totalFiles = fileNames.length;
    const totalDuration = 4000; // 4 seconds total
    const fileProcessingTime = totalDuration / totalFiles; // Time per file
    
    // Process files one by one with staggered timing
    fileNames.forEach((_, index) => {
      // Start processing this file
      setTimeout(() => {
        setFileStatuses(prev => ({ ...prev, [index]: 'processing' }));
      }, index * fileProcessingTime);
      
      // Complete this file
      setTimeout(() => {
        setFileStatuses(prev => ({ ...prev, [index]: 'complete' }));
        setCompletedFiles(index + 1);
        setUploadProgress(((index + 1) / totalFiles) * 100);
        
        // If this is the last file, reset after a delay
        if (index === totalFiles - 1) {
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            setCompletedFiles(0);
            setFileStatuses({});
          }, 2000); // Show completion for 2 seconds
        }
      }, (index + 1) * fileProcessingTime);
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, listingsPerMonth: listings || undefined }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setStatus("success");
      setMessage("You're on the list! We'll be in touch soon.");
      setEmail("");
      setListings("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      if (!res.ok) throw new Error("Failed to join waitlist");
      setNewsletterStatus("success");
      setNewsletterMessage("Thanks for subscribing!");
      setNewsletterEmail("");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("Something went wrong. Please try again.");
    }
  }

  // Smooth scroll function for navigation
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main>
      <Navigation />
      {/* Hero */}
      <section id="hero" className="min-h-screen flex items-center" style={{ backgroundColor: "var(--bg-section-neutral)" }}>
        <div className="mx-auto max-w-7xl px-6 py-16 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Virtual Staging That{" "}
              <span className="italic">Sells Homes Faster</span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Stop spending <strong>$500+ per listing</strong> on physical staging. 
              Transform empty rooms into stunning staged photos in minutes for just{" "}
              <strong className="text-blue-600">$0.29 each</strong>.
            </p>

            {/* Waitlist Form */}
            <div id="waitlist" className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-lg">
              <h3 className="text-xl font-bold mb-2">Join 1,000+ agents on our waitlist</h3>
              <p className="text-gray-600 mb-6">
                Get early access & <strong>10 free staging credits</strong> when we launch
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': "var(--brand-primary)" } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-primary)40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
                <input
                  type="text"
                  value={listings}
                  onChange={(e) => setListings(e.target.value)}
                  placeholder="How many listings do you stage per month (optional)?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': "var(--brand-primary)" } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px var(--brand-primary)40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-primary-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
                >
                  {status === "loading" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      joining...
                    </>
                  ) : (
                    "get early access →"
                  )}
                </button>
                
                {message && (
                  <div className={`text-sm p-3 rounded-lg ${
                    status === "error" 
                      ? "bg-red-50 text-red-700 border border-red-200" 
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Before/After Images */}
          <div className="flex justify-center lg:justify-end">
            <BeforeAfterSlider priority={true} />
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <ProblemVsSolution />

      {/* Proven Results Section */}
      <section id="about" className="px-6 py-20" style={{ backgroundColor: "var(--brand-dark)" }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Proven Results That <span className="italic">Sell Homes</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Backed by real data from the National Association of Realtors and industry studies
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {/* Stat 1 - Higher Offers */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-4 text-white">
                Up to <AnimatedCounter end={10} suffix="%" duration={2000} className="inline" />
              </div>
              <div className="text-xl font-semibold text-white mb-4">Higher Offers</div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Staged homes sell for 1–10% more than unstaged homes according to NAR data.
              </p>
              <div className="text-sm text-gray-400">— NAR Data</div>
            </div>

            {/* Stat 2 - Faster Sales */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-4 text-white">
                <AnimatedCounter end={73} suffix="%" duration={2200} className="inline" /> Faster Sales
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Staged homes spend 73% less time on the market.
              </p>
              <div className="text-sm text-gray-400">— NAR Data</div>
            </div>

            {/* Stat 3 - ROI */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-4 text-white">5-6X</div>
              <div className="text-xl font-semibold text-white mb-4">ROI</div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Every $1 spent on staging can return $5–6 at sale according to industry data.
              </p>
              <div className="text-sm text-gray-400">— Home Staging Institute</div>
            </div>
          </div>


          {/* 
            TODO: Add testimonials section here when real testimonials are available
            
            Styled design ready to use:
            - White cards matching brand design
            - 5-star ratings
            - Professional testimonial layout
            - Avatars using brand color
            - Clean typography
            
            Perfect for when early access users provide testimonials in exchange for free credits
          */}
        </div>
      </section>

      {/* Core Features Section */}
      <div id="features">
        <CoreFeatures3Up />
      </div>

            {/* Before/After Gallery */}
            <section id="examples" className="px-6 py-20" style={{ backgroundColor: "var(--brand-white)" }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              See the <span className="italic" style={{ color: "var(--brand-primary)" }}>Difference</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Real examples of our compliance-focused staging. Notice how we preserve every architectural detail 
              while creating stunning, sellable spaces.
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            
            {/* Example 1 - Living Room */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Living Room Transformation</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Empty space transformed with modern furniture while preserving original windows, walls, and flooring.
                </p>
              </div>
              
              {/* Interactive Before/After Slider */}
              <div className="mb-4">
                <BeforeAfterSlider 
                  beforeImage="/images/emptyroom.jpg"
                  afterImage="/images/stagedroom.png"
                  beforeAlt="Empty living room before staging"
                  afterAlt="Staged living room after virtual staging"
                  beforeLabel="Empty Room"
                  afterLabel="Staged Room"
                />
              </div>
              
              {/* Compliance Features & Micro-labels */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Structure preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Auto watermarked</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">No flooring changes</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Buyer appeal</span>
                </div>
              </div>
            </div>

            {/* Example 2 - Bedroom */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Master Bedroom</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Furniture-only staging that maintains original lighting and architectural features.
                </p>
              </div>
              
              {/* Interactive Before/After Slider */}
              <div className="mb-4">
                <BeforeAfterSlider 
                  beforeImage="/images/emptymasterbed.jpg"
                  afterImage="/images/stagedmasterbed.png"
                  beforeAlt="Empty bedroom before staging"
                  afterAlt="Staged bedroom after virtual staging"
                  beforeLabel="Empty Room"
                  afterLabel="Staged Room"
                />
              </div>
              
              {/* Compliance Features & Micro-labels */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Original lighting</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Style consistency</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Windows preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">MLS compliant</span>
                </div>
              </div>
            </div>

            {/* Example 3 - Kitchen */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Kitchen & Dining</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Added dining furniture and décor without altering cabinets, counters, or fixtures.
                </p>
              </div>
              
              {/* Interactive Before/After Slider */}
              <div className="mb-4">
                <BeforeAfterSlider 
                  beforeImage="/images/emptykitchen.png"
                  afterImage="/images/stagedkitchen.png"
                  beforeAlt="Empty kitchen before staging"
                  afterAlt="Staged kitchen after virtual staging"
                  beforeLabel="Empty Space"
                  afterLabel="Staged Space"
                />
              </div>
              
              {/* Compliance Features & Micro-labels */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Fixtures untouched</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Cabinets preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Counters unchanged</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Auto watermarked</span>
                </div>
              </div>
            </div>

            {/* Example 4 - Home Office */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Home Office</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Transformed spare room into functional office space while preserving window placement.
                </p>
              </div>
              
              {/* Interactive Before/After Slider */}
              <div className="mb-4">
                <BeforeAfterSlider 
                  beforeImage="/images/emptyoffice.jpg"
                  afterImage="/images/stagedoffice.png"
                  beforeAlt="Empty spare room before staging"
                  afterAlt="Staged home office after virtual staging"
                  beforeLabel="Spare Room"
                  afterLabel="Home Office"
                />
              </div>
              
              {/* Compliance Features & Micro-labels */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Windows preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Original lighting</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Functionality focus</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                  <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Buyer appeal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MLS Compliance Section */}
      <section className="px-6 py-20" style={{ backgroundColor: "var(--brand-accent)" }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              MLS-Compliant by <span className="italic">Design</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is built with real estate regulations in mind.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Furniture Only */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--brand-primary)" }}>
                <HomeIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Furniture-Only Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI never alters walls, windows, floors, or any structural elements. Only furniture and decor are added, ensuring complete MLS compliance.
              </p>
            </div>

            {/* Feature 2 - Auto Watermarking */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--brand-primary)" }}>
                <Badge className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Auto Watermarking</h3>
              <p className="text-gray-600 leading-relaxed">
                &ldquo;Virtually Staged&rdquo; watermarks are automatically applied to every staged image, clearly identifying enhanced photos to buyers and agents.
              </p>
            </div>

            {/* Feature 3 - Dual Export */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--brand-primary)" }}>
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Dual Export Package</h3>
              <p className="text-gray-600 leading-relaxed">
                Get both staged and original empty photos in one download. Perfect for MLS listings that require both versions to be available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Batch Processing Demo */}
      <section className="px-6 py-20 bg-gray-100">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Stage Entire Listings <span className="italic" style={{ color: "var(--brand-primary)" }}>in Minutes, Not Hours</span>
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Stop processing photos one by one. <strong>Drag in your entire listing folder</strong> and watch 
              all 15-20 photos get staged simultaneously with consistent styling.
            </p>
          </div>

          {/* Interactive Demo */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            
            {/* Upload Demo Simulator */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Try the Demo</h3>
                <p className="text-gray-600 mb-6">See how fast batch processing really is</p>
              </div>

              {/* Upload Zone */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer group ${
                  isUploading 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                }`}
                onClick={startBatchUploadDemo}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                    isUploading 
                      ? 'animate-pulse scale-110' 
                      : 'group-hover:scale-110'
                  }`} style={{ backgroundColor: "var(--brand-primary)" }}>
                    <Upload className={`w-8 h-8 text-white ${
                      isUploading 
                        ? 'animate-bounce' 
                        : 'group-hover:animate-bounce'
                    }`} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {isUploading ? 'Processing Files...' : 'Drop Your Listing Folder'}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {isUploading 
                      ? 'Watch the magic happen in real-time' 
                      : 'Drag & drop up to 25 photos at once'
                    }
                  </p>
                  <button 
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg ${
                      isUploading 
                        ? 'opacity-75 cursor-not-allowed' 
                        : 'hover:scale-105 cursor-pointer'
                    }`}
                    style={{ backgroundColor: "var(--brand-primary)" }}
                    disabled={isUploading}
                    onClick={(e) => {
                      e.stopPropagation();
                      startBatchUploadDemo();
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Processing...' : 'Start Demo Upload'}
                  </button>
                </div>
              </div>

              {/* Demo Progress (animated) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <span>
                    {isUploading 
                      ? 'Processing 18 photos...' 
                      : completedFiles === 18 && completedFiles > 0
                        ? 'All photos staged successfully! 🎉'
                        : 'Ready to process 18 photos'
                    }
                  </span>
                  <span className={`transition-all duration-300 ${
                    completedFiles === 18 && completedFiles > 0 ? 'text-green-600 font-bold' : ''
                  }`}>
                    {completedFiles} / 18 complete
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      background: completedFiles === 18 && completedFiles > 0
                        ? 'linear-gradient(90deg, var(--brand-success) 0%, #16a34a 100%)'
                        : `linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)`,
                      width: `${uploadProgress}%` 
                    }}
                  ></div>
                </div>

                {/* File list preview */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {[
                      'kitchen_1.jpg', 'living_room_1.jpg', 'master_bedroom.jpg', 'dining_room.jpg',
                      'bathroom_1.jpg', 'bedroom_2.jpg', 'basement.jpg', 'home_office.jpg',
                      'kitchen_2.jpg', 'living_room_2.jpg', 'bathroom_2.jpg', 'bedroom_3.jpg',
                      'exterior_front.jpg', 'backyard.jpg', 'garage.jpg', 'laundry_room.jpg',
                      'hallway.jpg', 'entryway.jpg'
                    ].map((filename, index) => {
                      const status = fileStatuses[index] || 'queued';
                      const isComplete = status === 'complete';
                      const isProcessing = status === 'processing';
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                            isComplete 
                              ? 'bg-green-50 hover:bg-green-100' 
                              : isProcessing 
                                ? 'bg-blue-50 hover:bg-blue-100' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isComplete 
                                ? 'bg-green-100' 
                                : isProcessing 
                                  ? 'bg-blue-100' 
                                  : 'bg-gray-100'
                            }`}>
                              {isComplete ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Camera className={`w-4 h-4 ${
                                  isProcessing ? 'text-blue-600' : 'text-gray-600'
                                }`} />
                              )}
                            </div>
                            <span className={`text-sm transition-colors duration-300 ${
                              isComplete 
                                ? 'text-green-700 font-medium' 
                                : isProcessing 
                                  ? 'text-blue-700' 
                                  : 'text-gray-700'
                            }`}>
                              {filename}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              isComplete 
                                ? 'bg-green-500' 
                                : isProcessing 
                                  ? 'bg-blue-500 animate-pulse' 
                                  : 'bg-gray-300'
                            }`}></div>
                            <span className={`text-xs transition-colors duration-300 ${
                              isComplete 
                                ? 'text-green-600 font-medium' 
                                : isProcessing 
                                  ? 'text-blue-600' 
                                  : 'text-gray-500'
                            }`}>
                              {isComplete 
                                ? 'Complete' 
                                : isProcessing 
                                  ? 'Processing' 
                                  : 'Queued'
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits & Features */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Agents Love Batch Processing</h3>
                
                <div className="space-y-6">
                  {/* Benefit 1 - Time Savings */}
                  <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Save 2-4 Hours Per Listing</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Instead of uploading and processing photos one by one, batch upload your entire listing folder. 
                        18 photos processed in under 5 minutes vs. 3+ hours manually.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 2 - Consistency */}
                  <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Perfect Style Consistency</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        All photos in your batch use the same style palette and furniture choices. 
                        Every room flows together for a cohesive, professional listing.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 3 - Progress Tracking */}
                  <div className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Real-Time Progress Tracking</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Watch your entire listing get processed with live progress updates. 
                        Know exactly when each room is ready for review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>



        </div>
      </section>

            {/* Features Bento Grid */}
            <section id="features" className="px-6 py-20" style={{ backgroundColor: "var(--bg-section-light)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Everything You Need to <span className="italic" style={{ color: "var(--brand-primary)" }}>Stage Faster</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Professional-grade virtual staging tools designed specifically for real estate agents and brokerages
            </p>
          </div>
          
          {/* Optimized Bento Grid Layout - Following Best Practices */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-auto">
            
            {/* PRIMARY: MLS Compliance - Largest Hero Feature (Emphasis) */}
            <div className="md:col-span-4 lg:col-span-4 bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              {/* Floating icon for visual balance */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-10 group-hover:opacity-30 transition-all duration-500 group-hover:scale-105">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-success)" }}>
                  <Shield className="w-10 h-10 text-white transition-all duration-300" />
                </div>
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 w-fit group-hover:bg-green-200 group-hover:scale-105 transition-all duration-300">
                  <CheckCircle className="w-3 h-3 transition-all duration-300" />
                  100% MLS Compliant
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-green-800 transition-colors duration-300">
                  MLS Compliance Guaranteed
                </h3>
                
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6 flex-1">
                  Built-in compliance mode ensures furniture-only edits, automatic watermarking, and dual exports. 
                  Never worry about MLS violations again.
                </p>
                
                {/* Simplified feature grid for better spacing */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 group-hover:bg-green-100 group-hover:scale-105 transition-all duration-300 cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 transition-all duration-300" />
                    <span className="text-xs font-medium text-gray-800">Furniture only</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 group-hover:bg-green-100 group-hover:scale-105 transition-all duration-300 cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 transition-all duration-300" />
                    <span className="text-xs font-medium text-gray-800">Auto watermark</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 group-hover:bg-green-100 group-hover:scale-105 transition-all duration-300 cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 transition-all duration-300" />
                    <span className="text-xs font-medium text-gray-800">Dual exports</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 group-hover:bg-green-100 group-hover:scale-105 transition-all duration-300 cursor-pointer">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 transition-all duration-300" />
                    <span className="text-xs font-medium text-gray-800">Structure preserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECONDARY: Style Palettes - Medium Feature (Taller) */}
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300" style={{ background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)` }}>
                  <Palette className="w-6 h-6 text-white transition-all duration-300" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Style Palettes</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>Consistent Styling</p>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">
                  Use presets like Minimal, Scandinavian, or Bohemian. Create custom prompts for brand consistency across all your listings.
                </p>
                
                {/* Enhanced style palette options with hover animations */}
                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span className="text-sm text-gray-700 font-medium">Modern Minimal</span>
                    <div className="w-6 h-6 rounded-lg bg-gray-300 shadow-sm hover:shadow-md transition-shadow duration-300"></div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span className="text-sm text-gray-700 font-medium">Scandinavian</span>
                    <div className="w-6 h-6 rounded-lg shadow-sm hover:shadow-md hover:animate-pulse transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}></div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg hover:bg-purple-100 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span className="text-sm text-gray-700 font-medium">Bohemian</span>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 shadow-sm hover:shadow-md hover:animate-pulse transition-all duration-300"></div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <span className="text-sm text-gray-700 font-medium">+ Custom Styles</span>
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 shadow-sm hover:shadow-md hover:animate-spin transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* TERTIARY: Review & Refine - Wide Feature */}
            <div className="md:col-span-4 lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Review & Refine</h3>
                  <p className="text-gray-600 text-sm">Before/after slider, approve or regenerate images. Perfect control over every result.</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center ml-4 group-hover:scale-105 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                  <Download className="w-6 h-6 text-white transition-all duration-300" />
                </div>
              </div>
              
              {/* Interactive Before/After preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Approval Status</span>
                  <span className="font-semibold text-green-600 group-hover:scale-105 transition-transform duration-300">12/15 Approved</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                    style={{ 
                      background: `linear-gradient(90deg, var(--brand-success) 0%, var(--brand-primary) 100%)`,
                      width: '80%' 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">MLS-ready exports available</div>
              </div>
            </div>

            {/* TERTIARY: Batch Upload - Square Feature */}
            <div className="md:col-span-2 lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                  <Upload className="w-6 h-6 text-white transition-all duration-300" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Batch Upload</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>Entire listings at once</p>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                  Drop in 15-20 photos from a listing folder. Process everything simultaneously.
                </p>
                
                {/* Interactive progress visualization */}
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                        style={{ 
                          background: `linear-gradient(90deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)`,
                          width: '75%' 
                        }}
                      ></div>
                    </div>
                    <span className="group-hover:scale-105 transition-transform duration-300">15 photos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                        style={{ 
                          background: `linear-gradient(90deg, var(--brand-blue-light) 0%, var(--brand-primary) 100%)`,
                          width: '45%',
                          animationDelay: '200ms'
                        }}
                      ></div>
                    </div>
                    <span className="group-hover:scale-105 transition-transform duration-300">Processing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TERTIARY: Team Accounts - Square Feature */}
            <div className="md:col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-all duration-300" style={{ background: `linear-gradient(135deg, var(--brand-primary-hover) 0%, var(--brand-primary) 100%)` }}>
                  <Users className="w-5 h-5 text-white transition-all duration-300" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors duration-300">Team Accounts</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>Pro & Business</p>
                
                <p className="text-gray-600 text-xs leading-relaxed mb-3 flex-1">
                  Multi-seat access, shared brand assets, usage reporting.
                </p>
                
                {/* Interactive team avatars */}
                <div className="flex items-center -space-x-1 mt-auto mb-1 group-hover:space-x-1 transition-all duration-500">
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)` }}>A</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, #6B7280 0%, #374151 100%)` }}>B</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, var(--brand-blue-light) 0%, var(--brand-primary) 100%)` }}>C</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 hover:animate-pulse transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, var(--brand-blue-pale) 0%, #6B7280 100%)` }}>+</div>
                </div>
                <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Up to 10 seats</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="px-6 py-20" style={{ backgroundColor: "var(--brand-light)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-black/60 mb-6">Plans designed for agents and teams. Start with a free trial when we launch.</p>
            
            {/* Pricing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
                <div className="flex items-center">
                  <button 
                    onClick={() => setIsYearly(false)}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer hover:scale-105 ${
                      !isYearly 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setIsYearly(true)}
                    className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer hover:scale-105 ${
                      isYearly 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                    <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 17%</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Trust signals */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-900">🎉 Launch Special: Get 10 FREE Staging Credits!</h3>
              </div>
              <p className="text-green-800 font-medium mb-4">Join the first 1,000 agents on our waitlist and get 10 free staging credits when we launch - that&rsquo;s enough to test our entire service completely free!</p>
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>2 months free with annual billing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr_2fr] gap-8 max-w-6xl w-full text-left">
            {/* Agent */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 h-full flex flex-col" style={{ borderColor: "var(--brand-accent)" }}>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Agent</h3>
                <p className="text-black/60 mb-4">Perfect for solo agents</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: "var(--brand-primary)" }}>
                    ${isYearly ? pricingPlans.agent.yearlyMonthly : pricingPlans.agent.monthly}
                  </span>
                  <span className="text-black/60">/month</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-black/50 mt-1">${pricingPlans.agent.yearlyTotal} billed annually</p>
                )}
                <p className="text-sm text-black/50 mt-1">≈ ${pricingPlans.agent.perImage.toFixed(2)} per image</p>
                {isYearly && (
                  <p className="text-sm text-green-600 font-medium mt-1">Save 2 months free!</p>
                )}
              </div>
              
              <ul className="space-y-3 text-black/80 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>100 staged images/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>All MLS compliance tools</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Professional style palettes</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              
              <button 
                onClick={() => scrollToSection('waitlist')}
                className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 cursor-pointer mt-auto" 
                style={{ backgroundColor: "var(--brand-primary)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
              >
                Join Waitlist
              </button>
            </div>

            {/* Pro - Most Popular */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 h-full flex flex-col" style={{ borderColor: "var(--brand-primary)" }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-black/60 mb-4">Top producers & small teams</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: "var(--brand-primary)" }}>
                    ${isYearly ? pricingPlans.pro.yearlyMonthly : pricingPlans.pro.monthly}
                  </span>
                  <span className="text-black/60">/month</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-black/50 mt-1">${pricingPlans.pro.yearlyTotal} billed annually</p>
                )}
                <p className="text-sm text-black/50 mt-1">≈ ${pricingPlans.pro.perImage.toFixed(2)} per image</p>
                {isYearly && (
                  <p className="text-sm text-green-600 font-medium mt-1">Save 2 months free!</p>
                )}
              </div>
              
              <ul className="space-y-3 text-black/80 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>300 staged images/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Flyer & social media generator</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>3 team seats included</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <button 
                onClick={() => scrollToSection('waitlist')}
                className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 cursor-pointer mt-auto"
                style={{ backgroundColor: "var(--brand-primary)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
              >
                Join Waitlist
              </button>
            </div>

            {/* Business */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 h-full flex flex-col" style={{ borderColor: "var(--brand-accent)" }}>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Business</h3>
                <p className="text-black/60 mb-4">Brokerages & large teams</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: "var(--brand-primary)" }}>
                    ${isYearly ? pricingPlans.business.yearlyMonthly : pricingPlans.business.monthly}
                  </span>
                  <span className="text-black/60">/month</span>
                </div>
                {isYearly && (
                  <p className="text-sm text-black/50 mt-1">${pricingPlans.business.yearlyTotal} billed annually</p>
                )}
                <p className="text-sm text-black/50 mt-1">≈ ${pricingPlans.business.perImage.toFixed(2)} per image</p>
                {isYearly && (
                  <p className="text-sm text-green-600 font-medium mt-1">Save 2 months free!</p>
                )}
              </div>
              
              <ul className="space-y-3 text-black/80 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>800 staged images/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>10 seats + shared brand assets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Usage reporting per team member</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Centralized billing</span>
                </li>
              </ul>
              
              <button 
                onClick={() => scrollToSection('waitlist')}
                className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:scale-105 cursor-pointer mt-auto" 
                style={{ backgroundColor: "var(--brand-primary)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="px-6 py-20" style={{ backgroundColor: "var(--brand-accent)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Frequently Asked <span className="italic" style={{ color: "var(--brand-primary)" }}>Questions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about virtual staging with RoomsThatSell
            </p>
          </div>
          
          <div className="space-y-6">
            {/* FAQ 1 - MLS Compliance */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span>Is this MLS compliant and safe to use?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed text-lg mb-4">
                  <strong>Absolutely.</strong> Our compliance mode is specifically designed for MLS requirements. It ensures:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Furniture-only edits</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Auto watermarking</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Dual export package</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Structure preserved</span>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 2 - Staging Styles */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <span>What staging styles are available?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  We offer professional style palettes designed by interior designers:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-gray-300"></div>
                    <span className="font-medium text-gray-800">Modern Minimal</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: "var(--brand-primary)" }}></div>
                    <span className="font-medium text-gray-800">Scandinavian</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400"></div>
                    <span className="font-medium text-gray-800">Contemporary</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                    <span className="font-medium text-gray-800">Bohemian</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-400 to-emerald-400"></div>
                    <span className="font-medium text-gray-800">Traditional</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-colors duration-300">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400"></div>
                    <span className="font-medium text-gray-800">+ Custom Styles</span>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 3 - Free Trial */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-success)" }}>
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <span>How does the free trial work?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-6">
                  <h4 className="text-lg font-bold text-green-900 mb-3">🎉 Launch Special: 10 FREE Staging Credits!</h4>
                  <p className="text-green-800 font-medium">
                    The first 1,000 waitlist members get 10 free staging credits when we launch.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">10 credits = 1-2 listings</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">All features included</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">30-day guarantee</span>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 4 - Processing Time */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span>How fast is the processing time?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  Our AI-powered staging is incredibly fast compared to traditional methods:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <h4 className="font-bold text-green-700 text-lg mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      RoomsThatSell
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Single image: 30-60 seconds</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Full listing: 3-5 minutes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Batch processing supported</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                    <h4 className="font-bold text-red-700 text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Traditional Staging
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Scheduling: 1-2 weeks</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Setup & photography: 1-2 days</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Total time: 2-3 weeks</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 5 - File Formats */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <span>What file formats do you support?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Input Formats
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>JPEG (.jpg, .jpeg)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>PNG (.png)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>HEIC (iPhone photos)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>RAW files (.cr2, .nef, .arw)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                    <h4 className="font-bold text-green-900 text-lg mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Output Options
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>High-res JPEG (MLS ready)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Multiple resolutions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Watermarked versions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Before/after comparisons</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            {/* FAQ 6 - Billing Flexibility */}
            <details className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <summary className="font-bold text-xl cursor-pointer flex items-center justify-between text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: "var(--brand-success)" }}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span>Can I cancel or change my plan anytime?</span>
                </div>
                <span className="text-3xl group-open:rotate-45 transition-transform duration-300" style={{ color: "var(--brand-primary)" }}>+</span>
              </summary>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  <strong>Yes, absolutely.</strong> We believe in flexible billing that works for your business:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">Instant plan changes</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">30-day guarantee</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span className="font-medium text-gray-800">No long-term contracts</span>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* CTA at bottom of FAQ */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)` }}>
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Still have questions?</h3>
              <p className="text-lg mb-8 text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Join our waitlist and we&rsquo;ll send you more details as we get closer to launch. 
                Plus, get 10 free staging credits when we go live!
              </p>
              <button 
                onClick={() => scrollToSection('waitlist')}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white text-lg transition-all hover:shadow-xl hover:scale-105 duration-300 cursor-pointer"
                style={{ background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)` }}
              >
                <Users className="w-5 h-5" />
                Join Waitlist & Get Answers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16" style={{ backgroundColor: "var(--brand-dark)", color: "var(--brand-white)" }}>
        <div className="mx-auto max-w-7xl">
          {/* Main footer content */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company info */}
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">RoomsThatSell</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                The fastest, most affordable, and MLS-compliant virtual staging solution for real estate agents and brokerages. 
                Transform empty rooms into stunning staged photos in minutes.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm">MLS Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm">4.8/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-white/70">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors text-left cursor-pointer hover:scale-105">Features</button></li>
                <li><button onClick={() => scrollToSection('examples')} className="hover:text-white transition-colors text-left cursor-pointer hover:scale-105">Examples</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors text-left cursor-pointer hover:scale-105">Pricing</button></li>
                <li><button onClick={() => scrollToSection('faqs')} className="hover:text-white transition-colors text-left cursor-pointer hover:scale-105">FAQ</button></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-white/70">
                <li><a href="mailto:support@roomsthatsell.com" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MLS Guidelines</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="border-t border-white/10 pt-12 mb-12">
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="text-xl font-semibold mb-4">Stay Updated on Our Launch</h4>
              <p className="text-white/70 mb-6">
                Get the latest updates, tips, and exclusive early-bird offers delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading"}
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                  onMouseEnter={(e) => {
                    if (newsletterStatus !== "loading") {
                      e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newsletterStatus !== "loading") {
                      e.currentTarget.style.backgroundColor = "var(--brand-primary)";
                    }
                  }}
                >
                  {newsletterStatus === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </form>
              {newsletterMessage && (
                <div className={`text-sm mt-3 p-3 rounded-lg max-w-md mx-auto ${
                  newsletterStatus === "error" 
                    ? "bg-red-500/20 text-red-200 border border-red-400/30" 
                    : "bg-green-500/20 text-green-200 border border-green-400/30"
                }`}>
                  {newsletterMessage}
                </div>
              )}
            </div>
          </div>

          {/* Bottom footer */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-white/70">
                <p>© {new Date().getFullYear()} RoomsThatSell. All rights reserved.</p>
                <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              </div>
              
              {/* Final CTA */}
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="text-white font-semibold">Ready to get started?</div>
                  <div className="text-white/70">Join 1,000+ agents waitlisted</div>
                </div>
                <button 
                  onClick={() => scrollToSection('waitlist')}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all hover:shadow-lg hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
                >
                  <Users className="w-4 h-4" />
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
