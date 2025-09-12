'use client';

import { Shield, Clock, Palette, Users, Zap } from 'lucide-react';

// Colors now come from CSS variables in globals.css
// Access via var(--brand-primary), var(--brand-accent), etc.

/**
 * Problems vs Solutions section - extracted for reuse in blog posts and other pages
 * Shows the key problems agents face with staging and how RoomsThatSell solves them
 */
export function ProblemsVsSolutions() {
  return (
    <section style={{ backgroundColor: "var(--bg-section-muted)" }}>
      {/* Section Header */}
      <div className="px-6 py-20 pb-0">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Why Agents Choose <span className="italic" style={{ color: "var(--brand-primary)" }}>RoomsThatSell</span>
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
                      Brokerages can&rsquo;t manage team staging, track usage, or maintain brand standards across agents.
                    </p>
                    <div className="text-red-600 font-semibold text-sm">Problem: Scaling limitations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions Side - Blue Theme */}
          <div className="px-6 py-16 lg:px-16 lg:py-20" style={{ background: "linear-gradient(135deg, var(--brand-light) 0%, #E8F4FD 100%)" }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                <span className="text-white text-2xl">✅</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: "var(--brand-primary)" }}>Our Solutions</h3>
              <p className="text-gray-600">How RoomsThatSell fixes these issues</p>
            </div>

            <div className="space-y-6">
              {/* Solution 1 - MLS Compliance */}
              <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: "var(--brand-primary)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
              <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: "var(--brand-primary)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
              <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: "var(--brand-primary)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
              <div className="bg-white rounded-xl p-6 border-2" style={{ borderColor: "var(--brand-primary)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
            <div className="border-2 rounded-xl p-8 max-w-4xl mx-auto bg-white" style={{ borderColor: "var(--brand-primary)" }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-primary)" }}>Ready to Transform Your Staging Process?</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Join 1,000+ agents who are already waiting for the staging solution that actually works for real estate professionals.
              </p>
              <button 
                className="bg-white text-lg font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2"
                style={{ borderColor: "var(--brand-primary)", color: "var(--brand-primary)" }}
              >
                Join Waitlist → Get 10 Free Credits
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
