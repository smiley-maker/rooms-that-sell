import React from 'react';
import { Clock, Palette, DollarSign, ArrowRight } from 'lucide-react';

export interface CoreFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  microText?: string;
}

export interface CoreFeatures3UpProps {
  eyebrow?: string;
  headline?: string;
  subhead?: string;
  features?: CoreFeature[];
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

const defaultFeatures: CoreFeature[] = [
  {
    icon: Clock,
    title: "Lightning-fast workflow",
    description: "Upload a full listing and get staged images in minutes. Batch processing eliminates the photo-by-photo grind.",
    microText: "Typical time saved: 2–4 hours per listing"
  },
  {
    icon: Palette,
    title: "Style consistency across rooms",
    description: "Preset palettes or custom styles keep your brand cohesive from living room to primary suite.",
    microText: "Applies one style across the entire project"
  },
  {
    icon: DollarSign,
    title: "As low as $0.16 per image",
    description: "Transparent pricing that beats traditional staging by 90%+. Start with free credits—no card required.",
    microText: "Annual plans save an extra 16%"
  }
];

export function CoreFeatures3Up({
  eyebrow = "Core benefits",
  headline = "Stage faster, stay consistent, spend less",
  subhead = "Everything you need to turn empty rooms into buyer-ready listings—on time and under budget.",
  features = defaultFeatures,
  ctaText = "See all features",
  ctaHref,
  className = ""
}: CoreFeatures3UpProps) {
  return (
    <section className={`py-16 md:py-20 ${className}`} style={{ backgroundColor: "var(--bg-section-light)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
            {eyebrow}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            {headline}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subhead}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border bg-white/50 backdrop-blur shadow-sm hover:shadow-md transition-all duration-300 p-8 text-center"
              >
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Micro text */}
                {feature.microText && (
                  <p className="text-sm text-gray-500 font-medium">
                    {feature.microText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {ctaText && ctaHref && (
          <div className="text-center">
            <a
              href={ctaHref}
              className="inline-flex items-center text-base font-medium text-gray-900 hover:text-gray-700 transition-colors group"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default CoreFeatures3Up;
