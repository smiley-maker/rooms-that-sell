"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  CheckSquare, 
  Square, 
  Image as ImageIcon,
  Filter,
  X,
  MousePointerClick
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { ImageDisplay } from "./ImageDisplay";
import { cn } from "@/lib/utils";

interface ImageData {
  _id: Id<"images">;
  filename: string;
  roomType: string;
  status: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  metadata: {
    detectedFeatures?: string[];
    confidence?: number;
  };
}

interface BatchSelectorProps {
  images: ImageData[];
  selectedImageIds: Id<"images">[];
  onSelectionChange: (selectedIds: Id<"images">[]) => void;
  className?: string;
  maxSelection?: number;
}

interface FilterOptions {
  roomTypes: string[];
  statuses: string[];
}

export function BatchSelector({
  images,
  selectedImageIds,
  onSelectionChange,
  className,
  maxSelection
}: BatchSelectorProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    roomTypes: [],
    statuses: []
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter images based on current filters
  const filteredImages = images.filter(image => {
    const roomTypeMatch = filters.roomTypes.length === 0 || filters.roomTypes.includes(image.roomType);
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(image.status);
    return roomTypeMatch && statusMatch;
  });

  // Get unique room types and statuses for filter options
  const availableRoomTypes = [...new Set(images.map(img => img.roomType))];
  const availableStatuses = [...new Set(images.map(img => img.status))];

  // Only show images that can be staged (uploaded status)
  const stageableImages = filteredImages.filter(img => img.status === "uploaded");

  const handleImageToggle = (imageId: Id<"images">) => {
    const isSelected = selectedImageIds.includes(imageId);
    
    if (isSelected) {
      // Remove from selection
      onSelectionChange(selectedImageIds.filter(id => id !== imageId));
    } else {
      // Add to selection (check max limit)
      if (!maxSelection || selectedImageIds.length < maxSelection) {
        onSelectionChange([...selectedImageIds, imageId]);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedImageIds.length === stageableImages.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all stageable images (up to max limit)
      const imagesToSelect = maxSelection 
        ? stageableImages.slice(0, maxSelection).map(img => img._id)
        : stageableImages.map(img => img._id);
      onSelectionChange(imagesToSelect);
    }
  };

  const handleRoomTypeFilter = (roomType: string) => {
    setFilters(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.includes(roomType)
        ? prev.roomTypes.filter(rt => rt !== roomType)
        : [...prev.roomTypes, roomType]
    }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  const clearFilters = () => {
    setFilters({ roomTypes: [], statuses: [] });
  };

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case "kitchen": return "bg-orange-100 text-orange-800";
      case "living_room": return "bg-blue-100 text-blue-800";
      case "bedroom": return "bg-purple-100 text-purple-800";
      case "bathroom": return "bg-teal-100 text-teal-800";
      case "dining_room": return "bg-red-100 text-red-800";
      case "office": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploaded": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "staged": return "bg-green-100 text-green-800";
      case "approved": return "bg-purple-100 text-purple-800";
      case "exported": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No images available
          </h3>
          <p className="text-gray-500">
            Upload some images to start batch processing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Select Images for Batch Processing
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {stageableImages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                <MousePointerClick className="w-4 h-4 mr-2" />
                {selectedImageIds.length === stageableImages.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </div>
        
        {/* Selection Summary */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {selectedImageIds.length} of {stageableImages.length} images selected
          </span>
          {maxSelection && (
            <span>
              (Max: {maxSelection})
            </span>
          )}
          {selectedImageIds.length > 0 && (
            <Badge variant="secondary">
              {selectedImageIds.length} credit{selectedImageIds.length !== 1 ? 's' : ''} will be used
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {(filters.roomTypes.length > 0 || filters.statuses.length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            {/* Room Type Filters */}
            <div>
              <h5 className="text-sm font-medium mb-2">Room Types</h5>
              <div className="flex flex-wrap gap-2">
                {availableRoomTypes.map(roomType => (
                  <Badge
                    key={roomType}
                    variant={filters.roomTypes.includes(roomType) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      filters.roomTypes.includes(roomType) && getRoomTypeColor(roomType)
                    )}
                    onClick={() => handleRoomTypeFilter(roomType)}
                  >
                    {roomType.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <h5 className="text-sm font-medium mb-2">Status</h5>
              <div className="flex flex-wrap gap-2">
                {availableStatuses.map(status => (
                  <Badge
                    key={status}
                    variant={filters.statuses.includes(status) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      filters.statuses.includes(status) && getStatusColor(status)
                    )}
                    onClick={() => handleStatusFilter(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No stageable images message */}
        {stageableImages.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No images ready for staging
            </h3>
            <p className="text-gray-500 mb-4">
              {filteredImages.length === 0 
                ? "No images match your current filters."
                : "All filtered images have already been processed. Upload new images or adjust your filters."
              }
            </p>
            {images.length > 0 && (
              <div className="text-sm text-gray-400">
                <p>Debug info: {images.length} total images, {filteredImages.length} after filters</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[...new Set(images.map(img => img.status))].map(status => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {status}: {images.filter(img => img.status === status).length}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Grid */}
        {stageableImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stageableImages.map((image) => {
              const isSelected = selectedImageIds.includes(image._id);
              const isDisabled = maxSelection && !isSelected && selectedImageIds.length >= maxSelection;
              
              return (
                <div
                  key={image._id}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-200",
                    isSelected && "ring-2 ring-primary",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !isDisabled && handleImageToggle(image._id)}
                >
                  <Card className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 relative">
                      <ImageDisplay
                        imageId={image._id}
                        isStaged={false}
                        className="w-full h-full object-cover"
                        alt={image.filename}
                      />
                      
                      {/* Selection Overlay */}
                      <div className={cn(
                        "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "bg-white border-white text-gray-600"
                        )}>
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Room Type Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={getRoomTypeColor(image.roomType)}>
                          {image.roomType.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Selection Counter */}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedImageIds.indexOf(image._id) + 1}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate" title={image.filename}>
                        {image.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(image.fileSize / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}