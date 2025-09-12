import React from 'react';
import { TrendingDown, TrendingUp, ArrowRight, Clock, DollarSign, Zap } from 'lucide-react';

export default function ProblemVsSolution() {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: "var(--bg-section-light)" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
            The Staging Problem → Solution
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how we&apos;re transforming the real estate staging industry
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* Problem Side */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-red-100 hover:shadow-xl transition-all duration-300 h-full">
              {/* Problem Icon */}
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                The <span className="text-red-600">Problem</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Physical staging costs $500–$2,000 per listing</strong> - eating into your profits
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Takes weeks to coordinate</strong> - delaying your listing launch
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Empty rooms sit on market for months</strong> while you lose potential offers
                  </p>
                </div>
              </div>
              
              {/* Problem Stats */}
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-semibold">
                  💸 Average loss per empty room: <span className="text-lg">$10,000+</span>
                </p>
              </div>
            </div>
          </div>

          {/* Solution Side */}
          <div className="relative">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 h-full">
              {/* Solution Icon */}
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                The <span className="text-green-600">Solution</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Transform rooms in minutes</strong> for just $0.29 each
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>MLS-compliant virtual staging</strong> with both empty & staged versions
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    <strong>Professional results</strong> that help homes sell faster for more money
                  </p>
                </div>
              </div>
              
              {/* Solution Stats */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 font-semibold">
                  🚀 Average savings per listing: <span className="text-lg">$1,500+</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <button 
            className="inline-flex items-center gap-3 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ 
              backgroundColor: "var(--brand-primary)",
              background: "var(--brand-primary-gradient)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--brand-primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--brand-primary)"}
            onClick={() => {
              // Scroll to waitlist form
              const waitlistElement = document.getElementById('waitlist');
              if (waitlistElement) {
                waitlistElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Start Staging for $0.29 per Room
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
