"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Star, Users, Clock, Shield, TrendingUp, Zap, Camera, Download, Palette, Upload } from "lucide-react";

const BRAND = {
  primary: "#567D99",
  accent: "#EAF0F7",
  dark: "#2B2F34",
  light: "#F9FCFF",
  white: "#FFFFFF",
  success: "#22c55e",
  warning: "#f59e0b",
};

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

function AnimatedCurrency({ 
  value, 
  className = "",
  duration = 800 
}: { 
  value: number; 
  className?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      
      const startValue = displayValue;
      const difference = value - startValue;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        const currentValue = Math.round(startValue + (difference * easedProgress));
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [value, displayValue, duration]);

  return (
    <span className={`${className} ${isAnimating ? 'transition-all duration-300 scale-105' : ''}`}>
      ${displayValue.toLocaleString()}
    </span>
  );
}

function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  // Desktop: Follow mouse on hover (no dragging required)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  // Mobile: Keep original touch behavior for dragging
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Before/After Images */}
      <div 
        className="relative aspect-[4/3] overflow-hidden rounded-xl cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          handleMouseUp();
          setPosition(50); // Reset to center when mouse leaves on desktop
        }}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
        aria-label="Before and after virtual staging slider"
      >
        {/* Before Image (Empty Room) */}
        <div className="absolute inset-0">
          <Image
            src="/images/emptyroom.jpg"
            alt="Empty room before staging"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            Before
          </div>
        </div>

        {/* After Image (Staged Room) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src="/images/stagedroom.png"
            alt="Staged room after virtual staging"
            fill
            className="object-cover"
          />
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            After
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
            background: `linear-gradient(to right, #567D99 0%, #567D99 ${position}%, #e5e7eb ${position}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
    </div>
  );
}

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="px-6 py-4 bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-semibold text-lg">RoomsThatSell</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">about</a>
          <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">features</a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">pricing</a>
          <a href="#faqs" className="text-gray-600 hover:text-gray-900 transition-colors">faqs</a>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <a 
            href="#waitlist" 
            className="hidden md:inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            sign up for waitlist
          </a>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
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
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">about</a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">pricing</a>
            <a href="#faqs" className="text-gray-600 hover:text-gray-900 transition-colors">faqs</a>
            <a 
              href="#waitlist" 
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium transition-colors w-fit"
            >
              sign up for waitlist
            </a>
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

  // Cost Calculator State
  const [listingsPerMonth, setListingsPerMonth] = useState(3);
  const [photosPerListing, setPhotosPerListing] = useState(10);
  const [currentMethod, setCurrentMethod] = useState<"physical" | "virtual" | "none">("physical");

  // Batch Upload Demo State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [fileStatuses, setFileStatuses] = useState<Record<number, 'queued' | 'processing' | 'complete'>>({});

  // Cost Calculation Functions
  const calculateCurrentCost = () => {
    switch (currentMethod) {
      case "physical":
        return listingsPerMonth * 2500; // Average $2,500 per listing
      case "virtual":
        return listingsPerMonth * photosPerListing * 0.75; // $0.75 per image for competitors
      case "none":
        return 0;
      default:
        return 0;
    }
  };

  const calculateRoomsThatSellCost = () => {
    const totalPhotos = listingsPerMonth * photosPerListing;
    
    // Determine the best plan
    if (totalPhotos <= 100) {
      return 29; // Agent Plan
    } else if (totalPhotos <= 300) {
      return 49; // Pro Plan
    } else if (totalPhotos <= 800) {
      return 129; // Business Plan
    } else {
      // Pay-as-you-go for overage
      const basePhotos = 800;
      const overage = totalPhotos - basePhotos;
      return 129 + (overage * 0.50);
    }
  };

  const getRecommendedPlan = () => {
    const totalPhotos = listingsPerMonth * photosPerListing;
    
    if (totalPhotos <= 100) {
      return "Agent Plan";
    } else if (totalPhotos <= 300) {
      return "Pro Plan";
    } else if (totalPhotos <= 800) {
      return "Business Plan";
    } else {
      return "Business Plan + Credits";
    }
  };

  const currentCost = calculateCurrentCost();
  const roomsThatSellCost = calculateRoomsThatSellCost();
  const monthlySavings = currentCost - roomsThatSellCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = currentCost > 0 ? ((monthlySavings / currentCost) * 100) : 0;

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

  return (
    <main>
      <Navigation />
      {/* Hero */}
      <section className="min-h-screen flex items-center" style={{ backgroundColor: "#F3F2F2" }}>
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
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-lg">
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
                  style={{ '--tw-ring-color': BRAND.primary } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND.primary}40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
                <input
                  type="text"
                  value={listings}
                  onChange={(e) => setListings(e.target.value)}
                  placeholder="How many listings do you stage per month (optional)?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': BRAND.primary } as React.CSSProperties}
                  onFocus={(e) => e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND.primary}40`}
                  onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: BRAND.primary }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A6B85'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = BRAND.primary}
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
            <BeforeAfterSlider />
          </div>
        </div>
      </section>

      {/* Powerful Statistics Section */}
      <section className="px-6 py-20" style={{ backgroundColor: "#F3F2F2" }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Why Staging <span className="italic">Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Backed by real data from the National Association of Realtors and industry studies
            </p>
          </div>

          {/* Unified Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Stat 1 - Higher Offers */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>
                  Up to <AnimatedCounter end={10} suffix="%" duration={2000} className="inline" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">Higher Offers</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Staged homes sell for 1–10% more than unstaged homes according to NAR data.
                </p>
                <div className="text-xs text-gray-500 mt-4">— NAR &ldquo;Profile of Home Staging&rdquo; 2025</div>
              </div>
            </div>

            {/* Stat 2 - Sell Faster */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>
                  <AnimatedCounter end={73} suffix="%" duration={2200} className="inline" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">Faster Sales</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Staged homes spend 73% less time on the market than empty ones.
                </p>
                <div className="text-xs text-gray-500 mt-4">— The Zebra / NAR data</div>
              </div>
            </div>

            {/* Stat 3 - ROI */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>5-6X</div>
                <div className="text-lg font-semibold text-gray-900 mb-4">ROI</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Every $1 spent on staging can return $5–6 at sale according to industry data.
                </p>
                <div className="text-xs text-gray-500 mt-4">— Home Staging Institute</div>
              </div>
            </div>

            {/* Stat 4 - Photos Matter */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>
                  <AnimatedCounter end={73} suffix="%" duration={2500} className="inline" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">Say Photos Matter Most</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  of agents say listing photos are the most important marketing tool.
                </p>
                <div className="text-xs text-gray-500 mt-4">— NAR &ldquo;Profile of Home Staging&rdquo; 2025</div>
              </div>
            </div>

            {/* Stat 5 - Buyer Interest */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>
                  <AnimatedCounter end={60} suffix="%" duration={2200} className="inline" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">Buyer Influence</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  of buyer agents said staging influenced at least some of their clients.
                </p>
                <div className="text-xs text-gray-500 mt-4">— NAR &ldquo;Profile of Home Staging&rdquo; 2025</div>
              </div>
            </div>

            {/* Stat 6 - Waitlisted Agents */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden" style={{ borderColor: BRAND.primary }}>
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                Join them!
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>
                  <AnimatedCounter end={1000} suffix="+" duration={3000} className="inline" />
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-4">Agents Waitlisted</div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  real estate agents are already on our waitlist for early access.
                </p>
                <div className="text-xs font-medium mt-4" style={{ color: BRAND.primary }}>Join them today →</div>
              </div>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                The Math is Simple: Save Thousands with Virtual Staging
              </h3>
              <p className="text-gray-600 text-lg">Compare traditional staging costs vs. RoomsThatSell</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional Staging */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-red-600 text-2xl">💸</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Traditional Physical Staging</h4>
                  <div className="text-4xl font-bold text-red-600 mb-2">$500 - $5,000+</div>
                  <div className="text-gray-600 mb-6 font-medium">per listing</div>
                  <ul className="text-sm text-gray-600 space-y-3 text-left">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Furniture rental costs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Setup and removal time</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Scheduling coordination</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>Limited style options</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      <span>1-3 weeks turnaround</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Virtual Staging */}
              <div className="rounded-xl p-6 border-2 relative overflow-hidden" style={{ backgroundColor: BRAND.light, borderColor: BRAND.primary }}>
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  Save 90%+
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">RoomsThatSell Virtual Staging</h4>
                  <div className="text-4xl font-bold mb-2" style={{ color: BRAND.primary }}>$0.29 - $0.50</div>
                  <div className="text-gray-600 mb-6 font-medium">per image</div>
                  <ul className="text-sm text-gray-600 space-y-3 text-left">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span>Instant results in minutes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span>Unlimited style options</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span>MLS-compliant guarantee</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span>Batch processing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span>Same-day delivery</span>
                    </li>
                  </ul>
                </div>
              </div>
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

      {/* Problems vs Solutions - Split Screen */}
      <section style={{ backgroundColor: "#FAFAFA" }}>
        {/* Section Header */}
        <div className="px-6 py-20 pb-0">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Why Agents Choose <span className="italic" style={{ color: BRAND.primary }}>RoomsThatSell</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We solve the core problems that cost agents time, money, and opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Split Screen Layout - Full Width */}
        <div className="grid lg:grid-cols-2 gap-0">
          
          {/* Problems Side - Red Theme */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 px-6 py-16 lg:px-16 lg:py-20">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-red-800 mb-2">Current Problems</h3>
                <p className="text-red-600">What agents struggle with today</p>
              </div>

              <div className="space-y-6">
                {/* Problem 1 - MLS Compliance Risk */}
                <div className="bg-white/80 rounded-xl p-6 border border-red-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">MLS Compliance Violations</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Digital staging tools make structural changes that violate MLS rules, risking fines and listing removal.
                      </p>
                      <div className="text-red-600 font-semibold text-sm">Risk: Penalties & removed listings</div>
                    </div>
                  </div>
                </div>

                {/* Problem 2 - Manual Processing */}
                <div className="bg-white/80 rounded-xl p-6 border border-red-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Time-Consuming Manual Work</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Processing photos one-by-one for entire listings takes hours and delays marketing timelines.
                      </p>
                      <div className="text-red-600 font-semibold text-sm">Cost: 2-4 hours per listing</div>
                    </div>
                  </div>
                </div>

                {/* Problem 3 - Inconsistent Branding */}
                <div className="bg-white/80 rounded-xl p-6 border border-red-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Palette className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Inconsistent Style & Branding</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Random staging results across listings hurt professional image and brand consistency.
                      </p>
                      <div className="text-red-600 font-semibold text-sm">Impact: Weakened brand value</div>
                    </div>
                  </div>
                </div>

                {/* Problem 4 - Solo Agent Limitations */}
                <div className="bg-white/80 rounded-xl p-6 border border-red-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">No Team Collaboration</h4>
                      <p className="text-gray-700 text-sm mb-2">
                        Brokerages can't manage team staging, track usage, or maintain brand standards across agents.
                      </p>
                      <div className="text-red-600 font-semibold text-sm">Problem: Scaling limitations</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions Side - Blue Theme */}
            <div className="px-6 py-16 lg:px-16 lg:py-20" style={{ background: `linear-gradient(135deg, ${BRAND.light} 0%, #E8F4FD 100%)` }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white text-2xl">✅</span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>Our Solutions</h3>
                <p className="text-gray-600">How RoomsThatSell fixes these issues</p>
              </div>

              <div className="space-y-6">
                {/* Solution 1 - MLS Compliance */}
                <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">MLS Compliance Guaranteed</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Built-in compliance mode: furniture-only edits, automatic watermarking, dual exports. Zero structural changes.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Furniture Only</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Auto Watermarks</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Dual Export</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solution 2 - Batch Processing */}
                <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Smart Batch Processing</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Upload entire listings or select photo groups. Process 15-20 images in under 5 minutes with progress tracking.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Bulk Upload</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">5min Results</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">Progress Tracking</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solution 3 - Style Building */}
                <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Custom Style Building</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Create branded style palettes with deterministic seeds. Every room matches your brand perfectly, every time.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Brand Consistency</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Custom Palettes</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">Reproducible</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solution 4 - Team Accounts */}
                <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Team & Brokerage Accounts</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Pro & Business plans include team seats, shared brand assets, usage reporting, and centralized billing.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Multi-Seat</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Usage Reports</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">Brand Assets</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Bottom CTA */}
        <div className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <div className="border-2 rounded-xl p-8 max-w-4xl mx-auto bg-white" style={{ borderColor: BRAND.primary }}>
                <h3 className="text-2xl font-bold mb-4" style={{ color: BRAND.primary }}>Ready to Transform Your Staging Process?</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Join 1,000+ agents who are already waiting for the staging solution that actually works for real estate professionals.
                </p>
                <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: BRAND.primary }}>
                  <Users className="w-5 h-5" />
                  Join the Waitlist - Get 20 Free Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="px-6 py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Everything You Need to <span className="italic" style={{ color: BRAND.primary }}>Stage Faster</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Professional-grade virtual staging tools designed specifically for real estate agents and brokerages
            </p>
          </div>
          
          {/* Optimized Bento Grid Layout - Following Best Practices */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4" style={{ gridTemplateRows: 'repeat(2, 220px) 250px' }}>
            
            {/* PRIMARY: MLS Compliance - Largest Hero Feature (Emphasis) */}
            <div className="md:col-span-4 lg:col-span-4 md:row-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              {/* Floating icon for visual balance */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-10 group-hover:opacity-30 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                  <Shield className="w-10 h-10 text-white group-hover:animate-pulse" />
                </div>
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 w-fit group-hover:bg-green-200 group-hover:scale-105 transition-all duration-300">
                  <CheckCircle className="w-3 h-3 group-hover:animate-spin" />
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
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800">Furniture only</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800">Auto watermark</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800">Dual exports</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-800">Structure preserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECONDARY: Style Palettes - Medium Feature (Taller) */}
            <div className="md:col-span-2 lg:col-span-2 md:row-span-2 bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #4A6B85 100%)` }}>
                  <Palette className="w-6 h-6 text-white group-hover:animate-bounce" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Style Palettes</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: BRAND.primary }}>Consistent Styling</p>
                
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
                    <div className="w-6 h-6 rounded-lg shadow-sm hover:shadow-md hover:animate-pulse transition-all duration-300" style={{ backgroundColor: BRAND.primary }}></div>
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center ml-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" style={{ backgroundColor: BRAND.primary }}>
                  <Download className="w-6 h-6 text-white group-hover:animate-bounce" />
                </div>
              </div>
              
              {/* Interactive Before/After preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Approval Status</span>
                  <span className="font-semibold text-green-600 group-hover:scale-110 transition-transform duration-300">12/15 Approved</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                    style={{ 
                      background: `linear-gradient(90deg, #22c55e 0%, ${BRAND.primary} 100%)`,
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" style={{ backgroundColor: BRAND.primary }}>
                  <Upload className="w-6 h-6 text-white group-hover:animate-bounce" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-900 transition-colors duration-300">Batch Upload</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: BRAND.primary }}>Entire listings at once</p>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                  Drop in 15-20 photos from a listing folder. Process everything simultaneously.
                </p>
                
                {/* Interactive progress visualization */}
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                        style={{ 
                          background: `linear-gradient(90deg, ${BRAND.primary} 0%, #4A6B85 100%)`,
                          width: '75%' 
                        }}
                      ></div>
                    </div>
                    <span className="group-hover:scale-110 transition-transform duration-300">15 photos</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden group-hover:h-3 transition-all duration-300">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 group-hover:animate-pulse" 
                        style={{ 
                          background: `linear-gradient(90deg, #93C5FD 0%, ${BRAND.primary} 100%)`,
                          width: '45%',
                          animationDelay: '200ms'
                        }}
                      ></div>
                    </div>
                    <span className="group-hover:scale-110 transition-transform duration-300">Processing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TERTIARY: Team Accounts - Square Feature */}
            <div className="md:col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group relative overflow-hidden cursor-pointer hover:scale-[1.02] hover:-translate-y-1">
              <div className="h-full flex flex-col">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" style={{ background: `linear-gradient(135deg, #4A6B85 0%, ${BRAND.primary} 100%)` }}>
                  <Users className="w-5 h-5 text-white group-hover:animate-bounce" />
                </div>
                
                <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors duration-300">Team Accounts</h3>
                <p className="text-xs font-semibold mb-3 group-hover:scale-105 transition-transform duration-300" style={{ color: BRAND.primary }}>Pro & Business</p>
                
                <p className="text-gray-600 text-xs leading-relaxed mb-3 flex-1">
                  Multi-seat access, shared brand assets, usage reporting.
                </p>
                
                {/* Interactive team avatars */}
                <div className="flex items-center -space-x-1 mt-auto mb-1 group-hover:space-x-1 transition-all duration-500">
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, ${BRAND.primary} 0%, #4A6B85 100%)` }}>A</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, #6B7280 0%, #374151 100%)` }}>B</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, #93C5FD 0%, ${BRAND.primary} 100%)` }}>C</div>
                  <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm hover:scale-125 hover:animate-pulse transition-all duration-300 cursor-pointer" style={{ background: `linear-gradient(135deg, #DBEAFE 0%, #6B7280 100%)` }}>+</div>
                </div>
                <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Up to 10 seats</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MLS Compliance Deep Dive */}
      <section className="px-6 py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              MLS Violations Can Cost You Big
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              100% MLS Compliant <span className="italic" style={{ color: BRAND.primary }}>Guaranteed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Other staging tools make dangerous structural changes that violate MLS rules. 
              RoomsThatSell is built specifically for real estate with <strong>compliance baked in</strong>.
            </p>
          </div>

          {/* Violation Examples Grid */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            
            {/* Dangerous Violations */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚠️</span>
                </div>
                <h3 className="text-2xl font-bold text-red-800 mb-2">Common MLS Violations</h3>
                <p className="text-red-600 font-medium">What other tools do that gets agents in trouble</p>
              </div>

              {/* Violation Examples */}
              <div className="space-y-4">
                <div className="bg-white border-2 border-red-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-xl">🏗️</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Structural Changes</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Adding windows, removing walls, changing room layouts, or altering architectural features.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-700 font-semibold text-sm">⚡ Violation Risk</div>
                        <div className="text-red-600 text-xs mt-1">$500-$2,000 fines + listing removal</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-red-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-xl">💡</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Lighting & Sky Changes</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Changing natural lighting, replacing skies in windows, or altering time-of-day appearance.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-700 font-semibold text-sm">⚡ Violation Risk</div>
                        <div className="text-red-600 text-xs mt-1">Misrepresentation claims</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-red-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-xl">🔍</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Missing Watermarks</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Not clearly marking images as "Virtually Staged" or "Digitally Enhanced."
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-700 font-semibold text-sm">⚡ Violation Risk</div>
                        <div className="text-red-600 text-xs mt-1">Consumer fraud liability</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-red-200 rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-xl">📁</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">No Original Photos</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Only providing staged photos without the original empty room versions.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-700 font-semibold text-sm">⚡ Violation Risk</div>
                        <div className="text-red-600 text-xs mt-1">MLS policy violations</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Our Compliance Solution */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white text-2xl">✅</span>
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: BRAND.primary }}>RoomsThatSell Protection</h3>
                <p className="text-gray-600 font-medium">How we keep you 100% compliant</p>
              </div>

              {/* Compliance Features */}
              <div className="space-y-4">
                <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <span className="text-white font-bold text-xl">🪑</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Furniture-Only Mode</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Our AI is trained to ONLY add furniture and décor. Never touches walls, windows, or structure.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-green-700 font-semibold text-sm">✅ 100% Safe</div>
                        <div className="text-green-600 text-xs mt-1">Built-in structural preservation</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <span className="text-white font-bold text-xl">🏷️</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Auto Watermarking</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Every staged image automatically gets "Virtually Staged" watermark. Never forget compliance.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-green-700 font-semibold text-sm">✅ 100% Safe</div>
                        <div className="text-green-600 text-xs mt-1">Automatic compliance labeling</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <span className="text-white font-bold text-xl">📁</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Dual Export System</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Get both original empty photos AND staged versions in one download package.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-green-700 font-semibold text-sm">✅ 100% Safe</div>
                        <div className="text-green-600 text-xs mt-1">MLS policy compliant</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: BRAND.primary }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
                      <span className="text-white font-bold text-xl">🛡️</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Compliance Focus</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Built specifically for real estate with MLS compliance as our top priority. Every feature designed with regulations in mind.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-green-700 font-semibold text-sm">✅ Compliance First</div>
                        <div className="text-green-600 text-xs mt-1">Purpose-built for real estate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Process Flow */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our 4-Step Compliance Process</h3>
              <p className="text-gray-600">Every image goes through these automated checks</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Structure Scan</h4>
                <p className="text-sm text-gray-600">AI identifies and protects all permanent fixtures</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Furniture Only</h4>
                <p className="text-sm text-gray-600">Add décor and furniture while preserving structure</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Auto Watermark</h4>
                <p className="text-sm text-gray-600">Apply "Virtually Staged" watermark automatically</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Dual Package</h4>
                <p className="text-sm text-gray-600">Deliver original + staged versions together</p>
              </div>
            </div>
          </div>


          {/* CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 rounded-xl p-8 max-w-4xl mx-auto" style={{ borderColor: BRAND.primary }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: BRAND.primary }}>Stage with Confidence</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Join 1,000+ agents who choose RoomsThatSell for compliance-focused virtual staging. 
                <strong>Purpose-built for real estate professionals.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: BRAND.primary }}>
                  <Shield className="w-5 h-5" />
                  Get Compliant Staging
                </button>
                <div className="text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                  10 free credits at launch
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="px-6 py-20" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              See the <span className="italic" style={{ color: BRAND.primary }}>Difference</span>
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
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Living Room Transformation</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Empty space transformed with modern furniture while preserving original windows, walls, and flooring.
                </p>
              </div>
              
              {/* Before/After Comparison */}
              <div className="relative aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden mb-4">
                {/* Placeholder for your actual images */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gray-300 flex items-center justify-center border-r-2 border-gray-400">
                    <div className="text-center text-gray-600">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm font-medium">BEFORE</div>
                      <div className="text-xs">Empty Room</div>
                    </div>
                  </div>
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: BRAND.accent }}>
                    <div className="text-center" style={{ color: BRAND.primary }}>
                      <Star className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">AFTER</div>
                      <div className="text-xs">Staged Room</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Compliance Features Highlighted */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Structure preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Auto watermarked</span>
                </div>
              </div>
            </div>

            {/* Example 2 - Bedroom */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Master Bedroom</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Furniture-only staging that maintains original lighting and architectural features.
                </p>
              </div>
              
              {/* Before/After Comparison */}
              <div className="relative aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gray-300 flex items-center justify-center border-r-2 border-gray-400">
                    <div className="text-center text-gray-600">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm font-medium">BEFORE</div>
                      <div className="text-xs">Empty Room</div>
                    </div>
                  </div>
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: BRAND.accent }}>
                    <div className="text-center" style={{ color: BRAND.primary }}>
                      <Star className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">AFTER</div>
                      <div className="text-xs">Staged Room</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Original lighting</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Style consistency</span>
                </div>
              </div>
            </div>

            {/* Example 3 - Kitchen */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Kitchen & Dining</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Added dining furniture and décor without altering cabinets, counters, or fixtures.
                </p>
              </div>
              
              <div className="relative aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gray-300 flex items-center justify-center border-r-2 border-gray-400">
                    <div className="text-center text-gray-600">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm font-medium">BEFORE</div>
                      <div className="text-xs">Empty Space</div>
                    </div>
                  </div>
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: BRAND.accent }}>
                    <div className="text-center" style={{ color: BRAND.primary }}>
                      <Star className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">AFTER</div>
                      <div className="text-xs">Staged Space</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Fixtures untouched</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">MLS compliant</span>
                </div>
              </div>
            </div>

            {/* Example 4 - Home Office */}
            <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-500">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Home Office</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Transformed spare room into functional office space while preserving window placement.
                </p>
              </div>
              
              <div className="relative aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden mb-4">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gray-300 flex items-center justify-center border-r-2 border-gray-400">
                    <div className="text-center text-gray-600">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm font-medium">BEFORE</div>
                      <div className="text-xs">Spare Room</div>
                    </div>
                  </div>
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: BRAND.accent }}>
                    <div className="text-center" style={{ color: BRAND.primary }}>
                      <Star className="w-12 h-12 mx-auto mb-2" />
                      <div className="text-sm font-medium">AFTER</div>
                      <div className="text-xs">Home Office</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Windows preserved</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-800">Buyer appeal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>100%</div>
                <div className="text-sm text-gray-700">Structure preserved in every image</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>Auto</div>
                <div className="text-sm text-gray-700">Watermarking on all staged photos</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>2x</div>
                <div className="text-sm text-gray-700">Files delivered (original + staged)</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>5min</div>
                <div className="text-sm text-gray-700">Average processing time per room</div>
              </div>
            </div>
          </div>

          {/* Note about placeholder images */}
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl mx-auto">
              <h4 className="font-bold text-gray-900 mb-2">Coming Soon: Real Examples</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Once our beta launches, this gallery will showcase actual before/after transformations from real estate agents. 
                The placeholders above demonstrate our compliance-focused approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Calculator & ROI */}
      <section className="px-6 py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Calculate Your <span className="italic" style={{ color: BRAND.primary }}>Savings</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See exactly how much you'll save compared to traditional staging. 
              Most agents <strong>recover their entire yearly cost</strong> with just one faster sale.
            </p>
          </div>

          {/* Interactive Calculator */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Calculator Controls */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Staging Needs</h3>
                  
                  {/* Listings per month slider */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      How many listings do you stage per month?
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={listingsPerMonth}
                        onChange={(e) => setListingsPerMonth(Number(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${BRAND.primary} 0%, ${BRAND.primary} ${(listingsPerMonth / 10) * 100}%, #e5e7eb ${(listingsPerMonth / 10) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1</span>
                        <span>5</span>
                        <span>10+</span>
                      </div>
                    </div>
                    <div className="text-center mt-3">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ backgroundColor: BRAND.accent, color: BRAND.primary }}>
                        <AnimatedCounter end={listingsPerMonth} duration={500} className="inline" /> listings/month
                      </span>
                    </div>
                  </div>

                  {/* Photos per listing */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Photos staged per listing?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => setPhotosPerListing(10)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium hover:shadow-md transition-all ${
                          photosPerListing === 10 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={photosPerListing === 10 ? { borderColor: BRAND.primary, backgroundColor: BRAND.accent, color: BRAND.primary } : {}}
                      >
                        8-10 photos
                      </button>
                      <button 
                        onClick={() => setPhotosPerListing(18)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium hover:shadow-md transition-all ${
                          photosPerListing === 18 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={photosPerListing === 18 ? { borderColor: BRAND.primary, backgroundColor: BRAND.accent, color: BRAND.primary } : {}}
                      >
                        15-20 photos
                      </button>
                      <button 
                        onClick={() => setPhotosPerListing(25)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium hover:shadow-md transition-all ${
                          photosPerListing === 25 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={photosPerListing === 25 ? { borderColor: BRAND.primary, backgroundColor: BRAND.accent, color: BRAND.primary } : {}}
                      >
                        25+ photos
                      </button>
                    </div>
                  </div>

                  {/* Current method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Current staging method?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="radio" 
                          name="method" 
                          checked={currentMethod === "physical"}
                          onChange={() => setCurrentMethod("physical")}
                          className="text-blue-600" 
                          style={{ accentColor: BRAND.primary }} 
                        />
                        <span className="text-sm">Physical staging ($500-$5,000/listing)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="radio" 
                          name="method" 
                          checked={currentMethod === "virtual"}
                          onChange={() => setCurrentMethod("virtual")}
                          className="text-blue-600" 
                          style={{ accentColor: BRAND.primary }} 
                        />
                        <span className="text-sm">Other virtual tools ($0.50-$1.00/image)</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="radio" 
                          name="method" 
                          checked={currentMethod === "none"}
                          onChange={() => setCurrentMethod("none")}
                          className="text-blue-600" 
                          style={{ accentColor: BRAND.primary }} 
                        />
                        <span className="text-sm">No staging (empty listings)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Display */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Savings Breakdown</h3>
                  
                  {/* Cost Comparison */}
                  <div className="space-y-4 mb-8">
                    {/* Current Method Cost */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">
                          {currentMethod === "physical" ? "Physical Staging" :
                           currentMethod === "virtual" ? "Other Virtual Tools" :
                           "No Staging"}
                        </h4>
                        <span className="text-xs text-red-600 font-medium">Current Method</span>
                      </div>
                      <div className="text-3xl font-bold text-red-600 mb-2">
                        <AnimatedCurrency value={currentCost} className="transition-all duration-300" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentMethod === "physical" ? `$2,500 × ${listingsPerMonth} listings/month` :
                         currentMethod === "virtual" ? `$0.75 × ${listingsPerMonth * photosPerListing} photos/month` :
                         "Losing sales due to empty listings"}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {currentMethod === "physical" ? "+ Setup time, coordination, removal" :
                         currentMethod === "virtual" ? "+ MLS compliance risks" :
                         "+ Longer time on market"}
                      </div>
                    </div>

                    {/* RoomsThatSell Cost */}
                    <div className="border-2 rounded-xl p-6" style={{ backgroundColor: BRAND.light, borderColor: BRAND.primary }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-gray-900">RoomsThatSell</h4>
                        <span className="text-xs font-medium" style={{ color: BRAND.primary }}>Recommended</span>
                      </div>
                      <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>
                        <AnimatedCurrency value={Math.round(roomsThatSellCost)} className="transition-all duration-300" />
                      </div>
                      <div className="text-sm text-gray-600">
                        {getRecommendedPlan()} - {listingsPerMonth * photosPerListing} photos/month
                      </div>
                      <div className="text-xs text-gray-500 mt-2">Instant results, no coordination needed</div>
                    </div>
                  </div>

                  {/* Savings Summary */}
                  {monthlySavings > 0 ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-green-700 mb-2">Monthly Savings</div>
                        <div className="text-4xl font-bold text-green-600 mb-2">
                          <AnimatedCurrency value={monthlySavings} className="transition-all duration-300" />
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          That's a {savingsPercentage.toFixed(1)}% cost reduction
                        </div>
                        
                        {/* Annual projection */}
                        <div className="border-t border-green-200 pt-4">
                          <div className="text-xs text-green-700 font-semibold mb-1">Annual Savings</div>
                          <div className="text-2xl font-bold text-green-600">
                            <AnimatedCurrency value={annualSavings} className="transition-all duration-300" />
                          </div>
                          <div className="text-xs text-gray-600">
                            {annualSavings > 50000 ? "Enough to hire an assistant or expand your business" :
                             annualSavings > 25000 ? "Significant savings to reinvest in marketing" :
                             "Great savings to boost your bottom line"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-blue-700 mb-2">Your Investment</div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          <AnimatedCurrency value={Math.round(roomsThatSellCost)} className="transition-all duration-300" />/month
                        </div>
                        <div className="text-sm text-gray-600">
                          Start staging your listings professionally
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ROI Examples */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Faster Sales</h4>
                <div className="text-2xl font-bold mb-2" style={{ color: BRAND.primary }}>1 Week</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Staged homes sell 73% faster. Save 1 week on market = recover entire yearly cost.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Higher Offers</h4>
                <div className="text-2xl font-bold mb-2" style={{ color: BRAND.primary }}>+$15k</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Just 3% higher sale price on a $500k home pays for 4+ years of staging.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">More Listings</h4>
                <div className="text-2xl font-bold mb-2" style={{ color: BRAND.primary }}>+2 Per Month</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Reinvest savings into marketing to get 2 extra listings = $100k+ more revenue.
                </p>
              </div>
            </div>
          </div>

          {/* Real Agent Examples */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real Agent Scenarios</h3>
              <p className="text-gray-600">See how different types of agents benefit</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Solo Agent */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>S</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Sarah - Solo Agent</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>2 listings/month</div>
                  <div>10 photos each</div>
                  <div className="font-semibold" style={{ color: BRAND.primary }}>Saves $1,950/month</div>
                  <div className="text-xs">vs. $1,000 physical staging per listing</div>
                </div>
              </div>

              {/* Top Producer */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>D</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">David - Top Producer</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>8 listings/month</div>
                  <div>15 photos each</div>
                  <div className="font-semibold" style={{ color: BRAND.primary }}>Saves $11,951/month</div>
                  <div className="text-xs">Pro Plan + huge time savings</div>
                </div>
              </div>

              {/* Brokerage */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>B</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Brokerage Team</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>30 listings/month</div>
                  <div>12 photos average</div>
                  <div className="font-semibold" style={{ color: BRAND.primary }}>Saves $44,871/month</div>
                  <div className="text-xs">Business Plan with team features</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 rounded-xl p-8 max-w-4xl mx-auto" style={{ borderColor: BRAND.primary }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: BRAND.primary }}>Start Saving Today</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Join 1,000+ agents who are already on our waitlist. Get <strong>10 free staging credits</strong> when we launch – 
                that's enough to test our service completely free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: BRAND.primary }}>
                  <TrendingUp className="w-5 h-5" />
                  Join Waitlist & Save
                </button>
                <div className="text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                  10 free credits at launch
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Batch Processing Demo */}
      <section className="px-6 py-20" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Upload Entire Listings <span className="italic" style={{ color: BRAND.primary }}>In Seconds</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
                  }`} style={{ backgroundColor: BRAND.primary }}>
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
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: BRAND.primary }}
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
                        ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                        : `linear-gradient(90deg, ${BRAND.primary} 0%, #4A6B85 100%)`,
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
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500 flex-shrink-0">
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
                  <div className="flex items-start gap-4 p-6 rounded-xl border border-blue-200" style={{ backgroundColor: BRAND.light }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND.primary }}>
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
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500 flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Real-Time Progress Tracking</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Watch your entire listing get processed with live progress updates. 
                        Know exactly when each room is ready for review.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 4 - Resumable */}
                  <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500 flex-shrink-0">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Resumable & Reliable</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Lost connection? No problem. Batch jobs are automatically saved and resumed. 
                        Never lose progress on large uploads.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison: Manual vs Batch */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Manual vs Batch Processing</h3>
              <p className="text-gray-600">See the dramatic difference in time and effort</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Manual Process */}
              <div className="bg-white rounded-xl p-6 border border-red-200">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">😤</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Manual Processing</h4>
                  <div className="text-3xl font-bold text-red-600 mb-2">3-4 Hours</div>
                  <div className="text-sm text-gray-600">Per 18-photo listing</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                    <span className="text-gray-700">Upload photo 1 → wait → download</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                    <span className="text-gray-700">Upload photo 2 → wait → download</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">...</div>
                    <span className="text-gray-700">Repeat 16 more times...</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">18</div>
                    <span className="text-gray-700">Finally done, exhausted</span>
                  </div>
                </div>
              </div>

              {/* Batch Process */}
              <div className="rounded-xl p-6 border-2" style={{ backgroundColor: BRAND.light, borderColor: BRAND.primary }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.primary }}>
                    <span className="text-white text-2xl">🚀</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">RoomsThatSell Batch</h4>
                  <div className="text-3xl font-bold mb-2" style={{ color: BRAND.primary }}>Under 5 Minutes</div>
                  <div className="text-sm text-gray-600">Same 18-photo listing</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND.primary }}>1</div>
                    <span className="text-gray-700">Drag entire folder into upload zone</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND.primary }}>2</div>
                    <span className="text-gray-700">Select style palette once</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: BRAND.primary }}>3</div>
                    <span className="text-gray-700">Watch progress bar → grab coffee ☕</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-gray-700 font-semibold">All 18 photos staged & ready!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Agent Use Cases */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Perfect for Busy Agents</h3>
              <p className="text-gray-600">See how batch processing fits your workflow</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Use Case 1 */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>📸</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">New Listing Day</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Just finished your photo shoot? Upload the entire folder while you grab lunch. 
                  Come back to fully staged, MLS-ready photos.
                </p>
              </div>

              {/* Use Case 2 */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>⚡</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Rush Orders</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Client wants listing live today? Batch process their photos in minutes, 
                  not hours. Beat the competition to market.
                </p>
              </div>

              {/* Use Case 3 */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: BRAND.accent }}>
                  <span className="text-2xl font-bold" style={{ color: BRAND.primary }}>📊</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Multiple Listings</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Have 3 listings to stage? Queue all three batches overnight. 
                  Wake up to 60+ staged photos ready to go.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 rounded-xl p-8 max-w-4xl mx-auto" style={{ borderColor: BRAND.primary }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: BRAND.primary }}>Ready to Save Hours Every Week?</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Join 1,000+ agents who can't wait to batch process their listings. 
                <strong>Stop the tedious one-by-one uploads forever.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: BRAND.primary }}>
                  <Upload className="w-5 h-5" />
                  Join Batch Upload Waitlist
                </button>
                <div className="text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                  10 free credits at launch
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-6 py-20" style={{ backgroundColor: BRAND.light }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-black/60 mb-6">Plans designed for agents and teams. Start with a free trial when we launch.</p>
            
            {/* Trust signals */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-black/60">
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>10 free staging credits at launch</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>2 months free with annual billing</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Agent */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2" style={{ borderColor: BRAND.accent }}>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Agent</h3>
                <p className="text-black/60 mb-4">Perfect for solo agents</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: BRAND.primary }}>$29</span>
                  <span className="text-black/60">/month</span>
                </div>
                <p className="text-sm text-black/50 mt-1">≈ $0.29 per image</p>
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
              
              <button className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: BRAND.primary }}>
                Join Waitlist
              </button>
            </div>

            {/* Pro - Most Popular */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 scale-105" style={{ borderColor: BRAND.primary }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-black/60 mb-4">Top producers & small teams</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: BRAND.primary }}>$49</span>
                  <span className="text-black/60">/month</span>
                </div>
                <p className="text-sm text-black/50 mt-1">≈ $0.16 per image</p>
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
              
              <button className="w-full rounded-lg px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 transition-all hover:shadow-lg">
                Join Waitlist
              </button>
            </div>

            {/* Business */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2" style={{ borderColor: BRAND.accent }}>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Business</h3>
                <p className="text-black/60 mb-4">Brokerages & large teams</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: BRAND.primary }}>$129</span>
                  <span className="text-black/60">/month</span>
                </div>
                <p className="text-sm text-black/50 mt-1">≈ $0.16 per image</p>
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
              
              <button className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: BRAND.primary }}>
                Join Waitlist
              </button>
            </div>

            {/* Pay-as-you-go */}
            <div className="relative rounded-xl border-2 bg-white p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2" style={{ borderColor: BRAND.accent }}>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Pay-as-you-go</h3>
                <p className="text-black/60 mb-4">Flexible option</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold" style={{ color: BRAND.primary }}>$15</span>
                  <span className="text-black/60">/30 credits</span>
                </div>
                <p className="text-sm text-black/50 mt-1">≈ $0.50 per image</p>
              </div>
              
              <ul className="space-y-3 text-black/80 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>30 staging credits (non-expiring)</span>
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
                  <span>Perfect for testing</span>
                </li>
              </ul>
              
              <button className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: BRAND.primary }}>
                Buy at Launch
              </button>
            </div>
          </div>

          {/* Bottom CTA and guarantees */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-bold mb-4">Launch Special: 10 Free Credits</h3>
              <p className="text-lg text-black/70 mb-6">
                Be among the first 1,000 agents to join our waitlist and get 10 free staging credits when we launch. 
                That&rsquo;s enough to test our service completely free, no card required.
              </p>
              <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all">
                <Users className="w-5 h-5" />
                Join 1,000+ Agents on Waitlist
              </button>
            </div>
            
            {/* Money back guarantee */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-black/60">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>No long-term contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-black/60">Everything you need to know about virtual staging with RoomsThatSell</p>
          </div>
          
          <div className="space-y-6">
            <details className="group bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>Is this MLS compliant and safe to use?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-black/70 leading-relaxed">
                  <strong>Absolutely.</strong> Our compliance mode is specifically designed for MLS requirements. It ensures:
                </p>
                <ul className="mt-3 space-y-2 text-black/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Furniture-only edits (no structural changes)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Automatic &ldquo;Virtually Staged&rdquo; watermarks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Dual export (empty + staged photos)</span>
                  </li>
                </ul>
              </div>
            </details>

            <details className="group bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>What staging styles are available?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-black/70 mb-3">
                  We offer professional style palettes designed by interior designers:
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Modern Minimal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Scandinavian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Contemporary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Bohemian</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Traditional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-green-500" />
                    <span>Custom styles</span>
                  </div>
                </div>
              </div>
            </details>

            <details className="group bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>How does the free trial work?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-black/70 mb-3">
                  <strong>Launch special:</strong> The first 1,000 waitlist members get 20 free staging credits when we launch.
                </p>
                <ul className="space-y-2 text-black/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No credit card required to join waitlist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>20 credits = 2-3 full listings staged for free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Access to all features during trial</span>
                  </li>
                </ul>
              </div>
            </details>

            <details className="group bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>How fast is the processing time?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-yellow-200">
                <p className="text-black/70 mb-3">
                  Our AI-powered staging is incredibly fast compared to traditional methods:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700">RoomsThatSell</h4>
                    <ul className="text-sm text-black/70 mt-2 space-y-1">
                      <li>• Single image: 30-60 seconds</li>
                      <li>• Full listing (15-20 photos): 3-5 minutes</li>
                      <li>• Batch processing supported</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700">Traditional Staging</h4>
                    <ul className="text-sm text-black/70 mt-2 space-y-1">
                      <li>• Scheduling: 1-2 weeks</li>
                      <li>• Setup & photography: 1-2 days</li>
                      <li>• Total time: 2-3 weeks</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            <details className="group bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>What file formats do you support?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-cyan-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Input Formats</h4>
                    <ul className="text-sm text-black/70 space-y-1">
                      <li>• JPEG (.jpg, .jpeg)</li>
                      <li>• PNG (.png)</li>
                      <li>• HEIC (iPhone photos)</li>
                      <li>• RAW files (.cr2, .nef, .arw)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Output Options</h4>
                    <ul className="text-sm text-black/70 space-y-1">
                      <li>• High-res JPEG (MLS ready)</li>
                      <li>• Multiple resolution options</li>
                      <li>• Watermarked versions</li>
                      <li>• Before/after comparisons</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            <details className="group bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-100 hover:shadow-md transition-all">
              <summary className="font-semibold text-lg cursor-pointer flex items-center justify-between">
                <span>Can I cancel or change my plan anytime?</span>
                <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-rose-200">
                <p className="text-black/70 mb-3">
                  <strong>Yes, absolutely.</strong> We believe in flexible billing that works for your business:
                </p>
                <ul className="space-y-2 text-black/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cancel anytime with no penalties</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Upgrade or downgrade plans instantly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>30-day money-back guarantee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No long-term contracts required</span>
                  </li>
                </ul>
              </div>
            </details>
          </div>

          {/* CTA at bottom of FAQ */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
              <p className="text-lg mb-6 opacity-90">
                Join our waitlist and we&rsquo;ll send you more details as we get closer to launch.
              </p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                Join Waitlist & Get Answers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16" style={{ backgroundColor: BRAND.dark, color: BRAND.white }}>
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
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-white/70">
                <li><a href="mailto:support@roomsthatsell.com" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">MLS Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
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
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                />
                <button
                  className="px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-white/70">
                <p>© {new Date().getFullYear()} RoomsThatSell. All rights reserved.</p>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              </div>
              
              {/* Final CTA */}
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <div className="text-white font-semibold">Ready to get started?</div>
                  <div className="text-white/70">Join 1,000+ agents waitlisted</div>
                </div>
                <a 
                  id="waitlist" 
                  href="#" 
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all hover:shadow-lg"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <Users className="w-4 h-4" />
                  Join Waitlist
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
