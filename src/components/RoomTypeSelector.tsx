"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  Tag,
  X
} from "lucide-react";
import { 
  detectRoomType, 
  getFallbackSuggestions,
  getRoomTypeOptions,
  getRoomTypeDisplayName,
  type RoomTypeDetectionResult
} from "../lib/roomTypeDetection";

interface RoomTypeSelectorProps {
  filename: string;
  currentRoomType?: string;
  onRoomTypeChange: (roomType: string) => void;
  metadata?: {
    description?: string;
    tags?: string[];
  };
  className?: string;
}

export function RoomTypeSelector({
  filename,
  currentRoomType,
  onRoomTypeChange,
  metadata,
  className = ""
}: RoomTypeSelectorProps) {
  const [detectionResult, setDetectionResult] = useState<RoomTypeDetectionResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<string>(currentRoomType || "unknown");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Run detection when filename changes
  useEffect(() => {
    if (filename) {
      setIsAnalyzing(true);
      // Simulate async analysis (in real implementation, this might call an API)
      setTimeout(() => {
        const result = detectRoomType(filename, metadata);
        setDetectionResult(result);
        
        // Auto-select if confidence is high and no current selection
        if (!currentRoomType && result.confidence >= 0.7) {
          setSelectedRoomType(result.roomType);
          onRoomTypeChange(result.roomType);
        }
        
        setIsAnalyzing(false);
      }, 500);
    }
  }, [filename, metadata, currentRoomType, onRoomTypeChange]);

  const handleRoomTypeSelect = (roomType: string) => {
    setSelectedRoomType(roomType);
    onRoomTypeChange(roomType);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (roomType: string) => {
    handleRoomTypeSelect(roomType);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.7) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  };

  const roomTypeOptions = getRoomTypeOptions();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Selection */}
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">Room Type:</span>
        <Select value={selectedRoomType} onValueChange={handleRoomTypeSelect}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {detectionResult && detectionResult.suggestions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSuggestions(true)}
            className="flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3" />
            Suggestions
          </Button>
        )}
      </div>

      {/* Detection Status */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          Analyzing room type...
        </div>
      )}

      {/* Auto-Detection Result */}
      {detectionResult && !isAnalyzing && (
        <div className="flex items-center gap-2 text-sm">
          {getConfidenceIcon(detectionResult.confidence)}
          <span className="text-gray-600">
            Auto-detected: 
          </span>
          <Badge variant="secondary">
            {getRoomTypeDisplayName(detectionResult.roomType)}
          </Badge>
          <span className={`text-xs ${getConfidenceColor(detectionResult.confidence)}`}>
            ({Math.round(detectionResult.confidence * 100)}% confidence)
          </span>
        </div>
      )}

      {/* Detected Features */}
      {detectionResult && detectionResult.detectedFeatures.length > 0 && (
        <div className="text-xs text-gray-500">
          <span>Detected features: </span>
          {detectionResult.detectedFeatures.map((feature, index) => (
            <span key={feature}>
              {feature}
              {index < detectionResult.detectedFeatures.length - 1 && ", "}
            </span>
          ))}
        </div>
      )}

      {/* Suggestions Dialog */}
      <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Room Type Suggestions
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Based on the filename &quot;{filename}&quot;, here are our suggestions:
            </p>
            
            {/* AI Suggestions */}
            {detectionResult && detectionResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI Suggestions</h4>
                {detectionResult.suggestions.map((suggestion, index) => (
                  <Card 
                    key={`${suggestion.roomType}-${index}`}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion.roomType)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getRoomTypeDisplayName(suggestion.roomType)}
                          </Badge>
                          <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                        {getConfidenceIcon(suggestion.confidence)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {suggestion.reason}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Fallback Suggestions */}
            {(!detectionResult || detectionResult.confidence < 0.5) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Common Room Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  {getFallbackSuggestions(filename).map((fallback) => (
                    <Button
                      key={fallback.roomType}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(fallback.roomType)}
                      className="justify-start text-xs"
                    >
                      {getRoomTypeDisplayName(fallback.roomType)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RoomTypeTagProps {
  roomType: string;
  confidence?: number;
  onEdit?: () => void;
  className?: string;
}

export function RoomTypeTag({ 
  roomType, 
  confidence, 
  onEdit, 
  className = "" 
}: RoomTypeTagProps) {
  const getTagColor = (type: string) => {
    switch (type) {
      case "kitchen": return "bg-orange-100 text-orange-800 border-orange-200";
      case "living_room": return "bg-blue-100 text-blue-800 border-blue-200";
      case "bedroom": 
      case "master_bedroom": 
      case "guest_room": return "bg-purple-100 text-purple-800 border-purple-200";
      case "bathroom": 
      case "powder_room": return "bg-teal-100 text-teal-800 border-teal-200";
      case "dining_room": return "bg-red-100 text-red-800 border-red-200";
      case "office": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "garage": return "bg-gray-100 text-gray-800 border-gray-200";
      case "basement": return "bg-stone-100 text-stone-800 border-stone-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getTagColor(roomType)} cursor-pointer ${className}`}
      onClick={onEdit}
    >
      <Tag className="w-3 h-3 mr-1" />
      {getRoomTypeDisplayName(roomType)}
      {confidence !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </Badge>
  );
}