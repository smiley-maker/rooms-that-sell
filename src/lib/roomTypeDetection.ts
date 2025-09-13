/**
 * Intelligent Room Type Detection System
 * 
 * This module provides comprehensive room type detection using:
 * 1. Filename parsing with pattern matching
 * 2. AI heuristics for structural feature detection
 * 3. Fallback suggestion system with confidence scoring
 */

export interface RoomTypeDetectionResult {
  roomType: string;
  confidence: number;
  suggestions: Array<{
    roomType: string;
    confidence: number;
    reason: string;
  }>;
  detectedFeatures: string[];
}

export const ROOM_TYPES = {
  kitchen: "Kitchen",
  living_room: "Living Room",
  bedroom: "Bedroom", 
  master_bedroom: "Master Bedroom",
  bathroom: "Bathroom",
  dining_room: "Dining Room",
  office: "Office/Study",
  basement: "Basement",
  garage: "Garage",
  laundry_room: "Laundry Room",
  family_room: "Family Room",
  guest_room: "Guest Room",
  walk_in_closet: "Walk-in Closet",
  foyer: "Foyer/Entryway",
  pantry: "Pantry",
  powder_room: "Powder Room",
  balcony: "Balcony/Patio",
  attic: "Attic",
  mudroom: "Mudroom",
  unknown: "Unknown"
} as const;

export type RoomType = keyof typeof ROOM_TYPES;

/**
 * Filename parsing patterns for room type detection
 */
const FILENAME_PATTERNS: Record<string, { patterns: RegExp[]; confidence: number }> = {
  kitchen: {
    patterns: [
      /kitchen/i,
      /kit\b/i,
      /cooking/i,
      /culinary/i
    ],
    confidence: 0.9
  },
  living_room: {
    patterns: [
      /living[\s_-]?room/i,
      /living/i,
      /lounge/i,
      /sitting[\s_-]?room/i,
      /great[\s_-]?room/i,
      /lr\b/i
    ],
    confidence: 0.85
  },
  bedroom: {
    patterns: [
      /bedroom/i,
      /bed[\s_-]?room/i,
      /br\d*/i,
      /sleeping/i,
      /\bbr\b/i
    ],
    confidence: 0.85
  },
  master_bedroom: {
    patterns: [
      /master[\s_-]?bedroom/i,
      /master[\s_-]?bed/i,
      /master[\s_-]?br/i,
      /mbr/i,
      /primary[\s_-]?bedroom/i,
      /main[\s_-]?bedroom/i
    ],
    confidence: 0.95
  },
  bathroom: {
    patterns: [
      /bathroom/i,
      /bath[\s_-]?room/i,
      /\bbath\b/i,
      /\bba\b/i,
      /washroom/i,
      /restroom/i,
      /powder[\s_-]?room/i
    ],
    confidence: 0.9
  },
  dining_room: {
    patterns: [
      /dining[\s_-]?room/i,
      /dining/i,
      /\bdr\b/i,
      /breakfast[\s_-]?nook/i,
      /eat[\s_-]?in/i
    ],
    confidence: 0.85
  },
  office: {
    patterns: [
      /office/i,
      /study/i,
      /den/i,
      /library/i,
      /work[\s_-]?room/i,
      /home[\s_-]?office/i
    ],
    confidence: 0.8
  },
  family_room: {
    patterns: [
      /family[\s_-]?room/i,
      /family/i,
      /rec[\s_-]?room/i,
      /recreation/i,
      /game[\s_-]?room/i,
      /media[\s_-]?room/i
    ],
    confidence: 0.8
  },
  basement: {
    patterns: [
      /basement/i,
      /cellar/i,
      /lower[\s_-]?level/i,
      /downstairs/i,
      /sub[\s_-]?level/i
    ],
    confidence: 0.9
  },
  garage: {
    patterns: [
      /garage/i,
      /car[\s_-]?port/i,
      /parking/i
    ],
    confidence: 0.95
  },
  laundry_room: {
    patterns: [
      /laundry/i,
      /wash[\s_-]?room/i,
      /utility[\s_-]?room/i,
      /mud[\s_-]?room/i
    ],
    confidence: 0.9
  },
  guest_room: {
    patterns: [
      /guest[\s_-]?room/i,
      /guest[\s_-]?bed/i,
      /spare[\s_-]?room/i,
      /spare[\s_-]?bed/i
    ],
    confidence: 0.85
  },
  walk_in_closet: {
    patterns: [
      /walk[\s_-]?in[\s_-]?closet/i,
      /closet/i,
      /wardrobe/i,
      /dressing[\s_-]?room/i
    ],
    confidence: 0.8
  },
  foyer: {
    patterns: [
      /foyer/i,
      /entry[\s_-]?way/i,
      /entrance/i,
      /front[\s_-]?hall/i,
      /vestibule/i
    ],
    confidence: 0.85
  },
  pantry: {
    patterns: [
      /pantry/i,
      /storage/i,
      /food[\s_-]?storage/i
    ],
    confidence: 0.8
  },
  powder_room: {
    patterns: [
      /powder[\s_-]?room/i,
      /half[\s_-]?bath/i,
      /guest[\s_-]?bath/i,
      /\d\/2[\s_-]?bath/i
    ],
    confidence: 0.9
  },
  balcony: {
    patterns: [
      /balcony/i,
      /patio/i,
      /deck/i,
      /terrace/i,
      /outdoor/i,
      /veranda/i
    ],
    confidence: 0.85
  },
  attic: {
    patterns: [
      /attic/i,
      /loft/i,
      /upper[\s_-]?level/i,
      /top[\s_-]?floor/i
    ],
    confidence: 0.9
  },
  mudroom: {
    patterns: [
      /mud[\s_-]?room/i,
      /entry[\s_-]?room/i,
      /back[\s_-]?entry/i
    ],
    confidence: 0.9
  }
};

/**
 * Structural features that can help identify room types
 */
const STRUCTURAL_FEATURES: Record<string, { keywords: string[]; roomTypes: RoomType[]; weight: number }> = {
  // Kitchen features
  cabinets: { keywords: ["cabinet", "cupboard"], roomTypes: ["kitchen", "laundry_room", "pantry"], weight: 0.8 },
  countertop: { keywords: ["counter", "granite", "marble", "quartz"], roomTypes: ["kitchen", "bathroom"], weight: 0.7 },
  appliances: { keywords: ["stove", "oven", "refrigerator", "dishwasher", "microwave"], roomTypes: ["kitchen"], weight: 0.9 },
  sink: { keywords: ["sink"], roomTypes: ["kitchen", "bathroom", "laundry_room"], weight: 0.6 },
  
  // Bathroom features
  toilet: { keywords: ["toilet", "commode"], roomTypes: ["bathroom", "powder_room"], weight: 0.95 },
  shower: { keywords: ["shower", "tub", "bathtub"], roomTypes: ["bathroom"], weight: 0.9 },
  vanity: { keywords: ["vanity", "mirror"], roomTypes: ["bathroom", "bedroom", "walk_in_closet"], weight: 0.6 },
  
  // Bedroom features
  bed: { keywords: ["bed", "mattress", "headboard"], roomTypes: ["bedroom", "master_bedroom", "guest_room"], weight: 0.8 },
  dresser: { keywords: ["dresser", "nightstand"], roomTypes: ["bedroom", "master_bedroom", "guest_room"], weight: 0.6 },
  
  // Living areas
  fireplace: { keywords: ["fireplace", "mantle", "hearth"], roomTypes: ["living_room", "family_room", "bedroom"], weight: 0.7 },
  sofa: { keywords: ["sofa", "couch", "sectional"], roomTypes: ["living_room", "family_room"], weight: 0.8 },
  
  // Dining
  table: { keywords: ["dining table", "table"], roomTypes: ["dining_room", "kitchen"], weight: 0.5 },
  
  // Office
  desk: { keywords: ["desk", "computer", "office chair"], roomTypes: ["office"], weight: 0.8 },
  
  // Storage
  shelving: { keywords: ["shelf", "shelving", "bookcase"], roomTypes: ["office", "pantry", "walk_in_closet"], weight: 0.4 },
  
  // Laundry
  washer: { keywords: ["washer", "dryer", "washing machine"], roomTypes: ["laundry_room"], weight: 0.95 },
  
  // Garage
  garage_door: { keywords: ["garage door", "overhead door"], roomTypes: ["garage"], weight: 0.9 },
  
  // General architectural
  stairs: { keywords: ["stairs", "staircase"], roomTypes: ["foyer", "basement"], weight: 0.5 },
  windows: { keywords: ["window", "natural light"], roomTypes: [], weight: 0.1 }, // All rooms can have windows
};

/**
 * Parse filename to detect room type hints
 */
export function parseFilenameForRoomType(filename: string): RoomTypeDetectionResult {
  const suggestions: Array<{ roomType: string; confidence: number; reason: string }> = [];
  let bestMatch: { roomType: string; confidence: number } | null = null;
  
  // Clean filename for better matching
  const cleanFilename = filename
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp)$/i, '') // Remove extension
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\d+/g, '') // Remove numbers for better pattern matching
    .trim();

  // Test each room type pattern
  for (const [roomType, { patterns, confidence }] of Object.entries(FILENAME_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(cleanFilename)) {
        const suggestion = {
          roomType,
          confidence,
          reason: `Filename contains "${pattern.source.replace(/[\/\\^$*+?.()|[\]{}]/g, '')}" pattern`
        };
        
        suggestions.push(suggestion);
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { roomType, confidence };
        }
        break; // Only match first pattern per room type
      }
    }
  }

  // Sort suggestions by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return {
    roomType: bestMatch?.roomType || "unknown",
    confidence: bestMatch?.confidence || 0,
    suggestions: suggestions.slice(0, 3), // Top 3 suggestions
    detectedFeatures: []
  };
}

/**
 * Analyze structural features in filename/metadata for room type hints
 */
export function analyzeStructuralFeatures(
  filename: string, 
  metadata?: { description?: string; tags?: string[] }
): RoomTypeDetectionResult {
  const suggestions: Array<{ roomType: string; confidence: number; reason: string }> = [];
  const detectedFeatures: string[] = [];
  const roomTypeScores: Record<string, number> = {};
  
  // Combine all text sources for analysis
  const textToAnalyze = [
    filename,
    metadata?.description || "",
    ...(metadata?.tags || [])
  ].join(" ").toLowerCase();

  // Analyze each structural feature
  for (const [featureName, { keywords, roomTypes, weight }] of Object.entries(STRUCTURAL_FEATURES)) {
    const featureDetected = keywords.some(keyword => 
      textToAnalyze.includes(keyword.toLowerCase())
    );
    
    if (featureDetected) {
      detectedFeatures.push(featureName);
      
      // Add scores to relevant room types
      for (const roomType of roomTypes) {
        roomTypeScores[roomType] = (roomTypeScores[roomType] || 0) + weight;
      }
    }
  }

  // Convert scores to suggestions
  for (const [roomType, score] of Object.entries(roomTypeScores)) {
    const confidence = Math.min(score / 2, 0.8); // Cap at 0.8 for structural analysis
    suggestions.push({
      roomType,
      confidence,
      reason: `Detected structural features: ${detectedFeatures.join(", ")}`
    });
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);
  
  const bestMatch = suggestions[0];

  return {
    roomType: bestMatch?.roomType || "unknown",
    confidence: bestMatch?.confidence || 0,
    suggestions: suggestions.slice(0, 3),
    detectedFeatures
  };
}

/**
 * Combine multiple detection methods for comprehensive room type detection
 */
export function detectRoomType(
  filename: string,
  metadata?: { description?: string; tags?: string[] }
): RoomTypeDetectionResult {
  // Get results from both methods
  const filenameResult = parseFilenameForRoomType(filename);
  const structuralResult = analyzeStructuralFeatures(filename, metadata);
  
  // Combine suggestions and remove duplicates
  const allSuggestions = [...filenameResult.suggestions, ...structuralResult.suggestions];
  const uniqueSuggestions = new Map<string, { roomType: string; confidence: number; reason: string }>();
  
  for (const suggestion of allSuggestions) {
    const existing = uniqueSuggestions.get(suggestion.roomType);
    if (!existing || suggestion.confidence > existing.confidence) {
      uniqueSuggestions.set(suggestion.roomType, suggestion);
    }
  }
  
  const finalSuggestions = Array.from(uniqueSuggestions.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  
  // Determine best match
  let bestMatch = finalSuggestions[0];
  
  // If filename detection has high confidence, prefer it
  if (filenameResult.confidence >= 0.8) {
    bestMatch = {
      roomType: filenameResult.roomType,
      confidence: filenameResult.confidence,
      reason: "High confidence filename match"
    };
  }
  
  return {
    roomType: bestMatch?.roomType || "unknown",
    confidence: bestMatch?.confidence || 0,
    suggestions: finalSuggestions,
    detectedFeatures: [...new Set([...filenameResult.detectedFeatures, ...structuralResult.detectedFeatures])]
  };
}

/**
 * Get fallback suggestions when confidence is low
 */
export function getFallbackSuggestions(filename: string): Array<{ roomType: string; reason: string }> {
  const fallbacks: Array<{ roomType: string; reason: string }> = [];
  
  // Common room types for real estate
  const commonRooms = [
    { roomType: "living_room", reason: "Most common room in listings" },
    { roomType: "bedroom", reason: "Common room type" },
    { roomType: "kitchen", reason: "Essential room in every home" },
    { roomType: "bathroom", reason: "Essential room in every home" },
    { roomType: "dining_room", reason: "Common in residential properties" }
  ];
  
  // If filename has any room-related words, suggest similar rooms
  const lowerFilename = filename.toLowerCase();
  if (lowerFilename.includes("room") || lowerFilename.includes("space")) {
    fallbacks.push(
      { roomType: "living_room", reason: "Generic room reference detected" },
      { roomType: "family_room", reason: "Alternative room interpretation" }
    );
  }
  
  // Add common rooms as fallback
  fallbacks.push(...commonRooms);
  
  // Remove duplicates and limit to 5
  const uniqueFallbacks = fallbacks.filter((item, index, self) => 
    index === self.findIndex(t => t.roomType === item.roomType)
  ).slice(0, 5);
  
  return uniqueFallbacks;
}

/**
 * Validate room type selection
 */
export function isValidRoomType(roomType: string): roomType is RoomType {
  return roomType in ROOM_TYPES;
}

/**
 * Get display name for room type
 */
export function getRoomTypeDisplayName(roomType: string): string {
  return ROOM_TYPES[roomType as RoomType] || "Unknown";
}

/**
 * Get room type options for UI selection
 */
export function getRoomTypeOptions(): Array<{ value: RoomType; label: string }> {
  return Object.entries(ROOM_TYPES).map(([value, label]) => ({
    value: value as RoomType,
    label
  }));
}