"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { CheckCircle, Star, Users, Clock, Shield, TrendingUp, Zap, Camera, Download, Palette } from "lucide-react";

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

function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
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
        onMouseLeave={handleMouseUp}
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
                Get early access & <strong>20 free staging credits</strong> when we launch
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

      {/* Challenges for Real Estate Agents */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">Challenges for Real Estate Agents</h2>
          <div className="grid md:grid-cols-2 gap-6 text-black/80">
            <ul className="space-y-3 bg-[#F5F8FC] p-6 rounded-md animate__animated animate__fadeInUp">
              <li className="flex gap-3"><span>•</span><span>Staging costs add up fast ($500–$5,000+ per listing).</span></li>
              <li className="flex gap-3"><span>•</span><span>Turnaround delays slow listings and marketing timelines.</span></li>
              <li className="flex gap-3"><span>•</span><span>Inconsistent style across photos hurts brand quality.</span></li>
              <li className="flex gap-3"><span>•</span><span>MLS compliance risk when structural edits slip through.</span></li>
              <li className="flex gap-3"><span>•</span><span>Clunky tools make batch processing tedious and error-prone.</span></li>
            </ul>
            <div className="space-y-3 p-6 rounded-md border animate__animated animate__fadeIn" style={{ borderColor: BRAND.accent }}>
              <p>
                We built RoomsThatSell to remove these blockers with MLS-safe, fast, and affordable virtual staging that scales across entire listings.
              </p>
              <p>
                Designed for agents and brokerages: predictable results, style consistency, and exports that meet MLS requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20" style={{ backgroundColor: BRAND.accent }}>
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features Built for Real Estate</h2>
            <p className="text-xl text-black/60">Everything you need to stage properties professionally and efficiently</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">MLS Compliance Guaranteed</h3>
              </div>
              <p className="text-black/70 mb-4">
                Built-in compliance mode ensures furniture-only edits, watermark toggles, and dual exports. 
                Never worry about MLS violations again.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Furniture-only staging mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Automatic watermarking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Dual export (empty + staged)</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Lightning Fast Processing</h3>
              </div>
              <p className="text-black/70 mb-4">
                Upload entire property folders and get staged results in minutes. 
                Batch processing saves hours of manual work.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Bulk upload & processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Results in under 5 minutes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Progress tracking & notifications</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Style Consistency</h3>
              </div>
              <p className="text-black/70 mb-4">
                Choose from professional style palettes or create custom ones. 
                Ensure every room matches your brand and vision.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Pre-designed style palettes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Custom style creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Deterministic results</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Unbeatable Economics</h3>
              </div>
              <p className="text-black/70 mb-4">
                Save 85% compared to traditional staging. From $0.16-$0.29 per image 
                vs $500-$5,000 per listing with physical staging.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Starting at $0.29 per image</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No setup or delivery fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Immediate ROI improvement</span>
                </li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Smart Room Detection</h3>
              </div>
              <p className="text-black/70 mb-4">
                AI automatically detects room types and suggests appropriate staging styles. 
                Manual override available for complete control.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Automatic room type detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Smart staging suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Manual override options</span>
                </li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Export & Review Tools</h3>
              </div>
              <p className="text-black/70 mb-4">
                Before/after slider for easy review, high-res downloads, and MLS-ready formats. 
                Approve or regenerate with one click.
              </p>
              <ul className="space-y-2 text-sm text-black/60">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Interactive before/after slider</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>High-resolution downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>One-click regeneration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">How It Works</h2>
          <ol className="grid md:grid-cols-3 gap-6 list-decimal list-inside">
            <li className="bg-[#F5F8FC] p-4 rounded-md transition-transform hover:-translate-y-1">Upload photos</li>
            <li className="bg-[#F5F8FC] p-4 rounded-md transition-transform hover:-translate-y-1">Choose style</li>
            <li className="bg-[#F5F8FC] p-4 rounded-md transition-transform hover:-translate-y-1">Download MLS-ready photos</li>
          </ol>
        </div>
      </section>

      {/* How We Solve It */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.white }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Our Approach</h3>
              <ul className="space-y-3 text-black/80">
                <li className="bg-[#F5F8FC] p-4 rounded-md">Compliance Mode: furniture-only edits, watermark toggle, dual export.</li>
                <li className="bg-[#F5F8FC] p-4 rounded-md">Style Palettes: deterministic seeds keep every room consistent.</li>
                <li className="bg-[#F5F8FC] p-4 rounded-md">Batch Processing: stage an entire listing in minutes.</li>
                <li className="bg-[#F5F8FC] p-4 rounded-md">Economical: from $0.16–$0.29 per image, great margins for teams.</li>
                <li className="bg-[#F5F8FC] p-4 rounded-md">Agent-Friendly UX: mobile-first, fast previews, easy approvals.</li>
              </ul>
            </div>
            <div className="rounded-md p-6 shadow border animate__animated animate__fadeIn" style={{ backgroundColor: BRAND.light, borderColor: BRAND.accent }}>
              <p className="text-black/80">
                Built on Next.js + Convex for speed and reliability. Images are stored on Cloudflare R2 and generated via Google Gemini 2.5 Flash Image with guardrails for MLS compliance.
              </p>
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
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>20 free staging credits at launch</span>
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
                  <span>24/7 email support</span>
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
                  <span>Flyer & social media templates</span>
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
                  <span>10 seats + brand assets</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Usage reporting & analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Dedicated account manager</span>
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
                  <span>30 staging credits</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>All MLS tools included</span>
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
              <h3 className="text-2xl font-bold mb-4">Launch Special: 20 Free Credits</h3>
              <p className="text-lg text-black/70 mb-6">
                Be among the first 1,000 agents to join our waitlist and get 20 free staging credits when we launch. 
                That&rsquo;s enough to stage 2-3 typical listings completely free.
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
