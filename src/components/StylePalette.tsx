"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  color: string;
  preview?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean lines, neutral colors, and uncluttered spaces with modern furniture",
    keywords: ["clean", "simple", "neutral", "white", "modern"],
    color: "bg-gray-100 text-gray-800",
    preview: "🤍"
  },
  {
    id: "scandinavian",
    name: "Scandinavian",
    description: "Light woods, cozy textures, and functional design with hygge elements",
    keywords: ["light wood", "cozy", "functional", "hygge", "natural"],
    color: "bg-blue-100 text-blue-800",
    preview: "🌿"
  },
  {
    id: "bohemian",
    name: "Bohemian",
    description: "Rich textures, warm colors, and eclectic mix of patterns and plants",
    keywords: ["eclectic", "warm", "textured", "plants", "colorful"],
    color: "bg-orange-100 text-orange-800",
    preview: "🌺"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sleek furniture, bold accents, and contemporary design elements",
    keywords: ["sleek", "contemporary", "bold", "geometric", "sophisticated"],
    color: "bg-purple-100 text-purple-800",
    preview: "✨"
  },
  {
    id: "traditional",
    name: "Traditional",
    description: "Classic furniture, rich fabrics, and timeless elegance",
    keywords: ["classic", "elegant", "rich", "timeless", "formal"],
    color: "bg-emerald-100 text-emerald-800",
    preview: "🏛️"
  }
];

interface StylePaletteProps {
  selectedStyle?: string;
  onStyleSelect: (styleId: string) => void;
  className?: string;
  compact?: boolean;
}

export function StylePalette({ 
  selectedStyle, 
  onStyleSelect, 
  className,
  compact = false 
}: StylePaletteProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {!compact && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Choose Style Palette</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select a style that will be consistently applied across all selected images
          </p>
        </div>
      )}
      
      <div className={cn(
        "grid gap-3",
        compact ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {STYLE_PRESETS.map((preset) => (
          <Card
            key={preset.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedStyle === preset.id 
                ? "ring-2 ring-primary shadow-md" 
                : "hover:ring-1 hover:ring-gray-300"
            )}
            onClick={() => onStyleSelect(preset.id)}
          >
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{preset.preview}</span>
                  <h4 className={cn(
                    "font-semibold",
                    compact ? "text-sm" : "text-base"
                  )}>
                    {preset.name}
                  </h4>
                </div>
                {selectedStyle === preset.id && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
              
              {!compact && (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    {preset.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {preset.keywords.slice(0, 3).map((keyword) => (
                      <Badge 
                        key={keyword} 
                        variant="secondary" 
                        className={cn("text-xs", preset.color)}
                      >
                        {keyword}
                      </Badge>
                    ))}
                    {preset.keywords.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{preset.keywords.length - 3}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}