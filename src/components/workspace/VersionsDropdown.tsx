"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ImageVersion } from "@/types/convex";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Star, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionsDropdownProps {
  imageId: Id<"images">;
  currentVersionId?: Id<"imageVersions">;
  isDisabled?: boolean;
  onVersionChange?: (versionId: Id<"imageVersions">) => void;
  onSeeAllVersions?: () => void;
}

export function VersionsDropdown({
  imageId,
  currentVersionId,
  isDisabled = false,
  onVersionChange,
  onSeeAllVersions,
}: VersionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  // const [previewVersionId, setPreviewVersionId] = useState<Id<"imageVersions"> | null>(null);

  // Fetch versions for this image
  const versions = useQuery(api.images.listImageVersions, { imageId });
  const setCurrentVersion = useMutation(api.images.setCurrentImageVersion);

  // Sort versions by creation date (newest first) and take last 5
  const recentVersions = versions
    ?.slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5) || [];

  const currentVersion = versions?.find(v => v._id === currentVersionId);

  const handleVersionSelect = async (versionId: Id<"imageVersions">) => {
    try {
      await setCurrentVersion({ imageId, versionId });
      onVersionChange?.(versionId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to set current version:", error);
    }
  };

  const handleVersionHover = (versionId: Id<"imageVersions">) => {
    // setPreviewVersionId(versionId);
    // TODO: Implement preview functionality - temporary swap in canvas
    console.log("Hovering over version:", versionId);
  };

  const handleVersionLeave = () => {
    // setPreviewVersionId(null);
    // TODO: Restore original image in canvas
  };

  const formatVersionLabel = (version: ImageVersion) => {
    const style = version.stylePreset || "Unknown Style";
    const hasDecor = version.customPrompt?.toLowerCase().includes("décor") || 
                     version.customPrompt?.toLowerCase().includes("decor");
    const decorText = hasDecor ? "Décor ON" : "Décor OFF";
    const time = new Date(version.createdAt).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${style} • ${decorText} • ${time}`;
  };

  const getVersionBadges = (version: ImageVersion) => {
    const badges = [];
    
    if (version._id === currentVersionId) {
      badges.push({ icon: Check, label: "Active", color: "text-green-600" });
    }
    
    if (version.pinned) {
      badges.push({ icon: Star, label: "Pinned", color: "text-yellow-600" });
    }
    
    // Check if this is the original version (first created)
    const isOriginal = versions?.length && 
      versions.sort((a, b) => a.createdAt - b.createdAt)[0]._id === version._id;
    if (isOriginal) {
      badges.push({ icon: Lock, label: "Original", color: "text-gray-600" });
    }
    
    return badges;
  };

  if (!versions || versions.length === 0) {
    return (
      <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
        No versions available
      </span>
    );
  }

  // If only one version exists, don't show dropdown
  if (versions.length === 1) {
    return (
      <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
        {currentVersion ? formatVersionLabel(currentVersion) : "Original Version"}
      </span>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={isDisabled}
        >
          Versions: {currentVersion ? formatVersionLabel(currentVersion) : "Original"}
          <ChevronDown className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="center" className="w-80">
        {recentVersions.map((version) => {
          const badges = getVersionBadges(version);
          const isActive = version._id === currentVersionId;
          
          return (
            <DropdownMenuItem
              key={version._id}
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer",
                isActive && "bg-blue-50"
              )}
              onClick={() => handleVersionSelect(version._id)}
              onMouseEnter={() => handleVersionHover(version._id)}
              onMouseLeave={handleVersionLeave}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Version thumbnail */}
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <div className="text-gray-500 text-xs font-medium">
                    {version.stylePreset.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatVersionLabel(version)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {badges.map((badge, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <badge.icon className={cn("w-3 h-3", badge.color)} />
                        <span className={cn("text-xs", badge.color)}>
                          {badge.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        {versions.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center justify-center p-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              onClick={() => {
                onSeeAllVersions?.();
                setIsOpen(false);
              }}
            >
              See all versions ({versions.length})
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
