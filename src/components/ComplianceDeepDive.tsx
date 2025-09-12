'use client';

import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

// Colors now come from CSS variables in globals.css
// Access via var(--brand-primary), var(--brand-accent), etc.

const ComplianceDeepDive = () => {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: 'var(--bg-section-light)' }}>
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Shield className="w-4 h-4" />
                MLS Violations Can Cost You Big
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                100% MLS Compliant <span className="italic" style={{ color: "var(--brand-primary)" }}>Guaranteed</span>
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
                          Not clearly marking images as &ldquo;Virtually Staged&rdquo; or &ldquo;Digitally Enhanced.&rdquo;
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
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-primary)" }}>RoomsThatSell Protection</h3>
                  <p className="text-gray-600 font-medium">How we keep you 100% compliant</p>
                </div>
  
                {/* Compliance Features */}
                <div className="space-y-4">
                  <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: "var(--brand-primary)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
  
                  <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: "var(--brand-primary)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
                        <span className="text-white font-bold text-xl">🏷️</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Auto Watermarking</h4>
                        <p className="text-gray-700 text-sm mb-3">
                          Every staged image automatically gets &ldquo;Virtually Staged&rdquo; watermark. Never forget compliance.
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-green-700 font-semibold text-sm">✅ 100% Safe</div>
                          <div className="text-green-600 text-xs mt-1">Automatic compliance labeling</div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: "var(--brand-primary)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
  
                  <div className="bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all" style={{ borderColor: "var(--brand-primary)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)" }}>
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
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Structure Scan</h4>
                  <p className="text-sm text-gray-600">AI identifies and protects all permanent fixtures</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Furniture Only</h4>
                  <p className="text-sm text-gray-600">Add décor and furniture while preserving structure</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Auto Watermark</h4>
                  <p className="text-sm text-gray-600">Apply &ldquo;Virtually Staged&rdquo; watermark automatically</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--brand-primary)" }}>
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dual Package</h4>
                  <p className="text-sm text-gray-600">Deliver original + staged versions together</p>
                </div>
              </div>
            </div>
  
  
            {/* CTA */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 rounded-xl p-8 max-w-4xl mx-auto" style={{ borderColor: "var(--brand-primary)" }}>
                <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-primary)" }}>Stage with Confidence</h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Join 1,000+ agents who choose RoomsThatSell for compliance-focused virtual staging. 
                  <strong>Purpose-built for real estate professionals.</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all" style={{ backgroundColor: "var(--brand-primary)" }}>
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
    );
  };

export default ComplianceDeepDive;