"use client";
import { useState } from "react";
import { CheckCircle, TrendingUp } from "lucide-react";

// Colors now come from CSS variables in globals.css
// Access via var(--brand-primary), var(--brand-accent), etc.

function AnimatedCounter({ 
  end, 
  suffix = "", 
  prefix = "", 
  className = ""
}: { 
  end: number; 
  suffix?: string; 
  prefix?: string; 
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}{end}{suffix}
    </span>
  );
}

function AnimatedCurrency({ 
  value, 
  className = ""
}: { 
  value: number; 
  className?: string;
}) {
  return (
    <span className={className}>
      ${value.toLocaleString()}
    </span>
  );
}

export default function CostCalculator() {
  const [listingsPerMonth, setListingsPerMonth] = useState(3);
  const [photosPerListing, setPhotosPerListing] = useState(10);
  const [currentMethod, setCurrentMethod] = useState<"physical" | "virtual" | "none">("physical");

  // Cost Calculation Functions
  const calculateCurrentCost = () => {
    switch (currentMethod) {
      case "physical":
        return listingsPerMonth * 2500; // Average $2,500 per listing
      case "virtual":
        return listingsPerMonth * photosPerListing * 0.75; // $0.75 per image for competitors
      case "none":
        return 0; // No direct costs, but lost sales potential
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
      return 79; // Pro Plan
    } else {
      return 149; // Team Plan
    }
  };

  const getRecommendedPlan = () => {
    const totalPhotos = listingsPerMonth * photosPerListing;
    
    if (totalPhotos <= 100) {
      return "Agent Plan";
    } else if (totalPhotos <= 300) {
      return "Pro Plan";
    } else {
      return "Team Plan";
    }
  };

  const currentCost = calculateCurrentCost();
  const roomsThatSellCost = calculateRoomsThatSellCost();
  const monthlySavings = currentCost - roomsThatSellCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = currentCost > 0 ? ((monthlySavings / currentCost) * 100) : 0;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Calculate Your <span className="italic" style={{ color: "var(--brand-primary)" }}>Savings</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            See exactly how much you&rsquo;ll save compared to traditional staging. 
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
                        background: `linear-gradient(to right, var(--brand-primary) 0%, var(--brand-primary) ${(listingsPerMonth / 10) * 100}%, #e5e7eb ${(listingsPerMonth / 10) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1</span>
                      <span>5</span>
                      <span>10+</span>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-md" style={{ backgroundColor: "var(--brand-accent)", color: "var(--brand-primary)" }}>
                      <AnimatedCounter end={listingsPerMonth} className="inline" /> listings/month
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
                      style={photosPerListing === 10 ? { borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-accent)", color: "var(--brand-primary)" } : {}}
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
                      style={photosPerListing === 18 ? { borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-accent)", color: "var(--brand-primary)" } : {}}
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
                      style={photosPerListing === 25 ? { borderColor: "var(--brand-primary)", backgroundColor: "var(--brand-accent)", color: "var(--brand-primary)" } : {}}
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
                        style={{ accentColor: "var(--brand-primary)" }} 
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
                        style={{ accentColor: "var(--brand-primary)" }} 
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
                        style={{ accentColor: "var(--brand-primary)" }} 
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
                  <div className="border-2 rounded-xl p-6" style={{ backgroundColor: "var(--brand-light)", borderColor: "var(--brand-primary)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">RoomsThatSell</h4>
                      <span className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>Recommended</span>
                    </div>
                    <div className="text-3xl font-bold mb-2" style={{ color: "var(--brand-primary)" }}>
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
                        That&apos;s a {savingsPercentage.toFixed(1)}% cost reduction
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

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 rounded-xl p-8 max-w-4xl mx-auto" style={{ borderColor: "var(--brand-primary)" }}>
            <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-primary)" }}>Start Saving Today</h3>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Join 1,000+ agents who are already on our waitlist. Get <strong>10 free staging credits</strong> when we launch – 
              that&apos;s enough to test our service completely free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: "var(--brand-primary)" }}>
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
  );
}
