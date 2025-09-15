"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ImageVersion } from "@/types/convex";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  Star, 
  Lock, 
  Download, 
  MoreVertical,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Component to handle loading version thumbnails
function VersionThumbnail({ 
  version,
  isOriginal = false 
}: { 
  version?: ImageVersion;
  isOriginal?: boolean 
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadThumbnail = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        if (isOriginal) {
          // For original version, show a simple placeholder
          if (mounted) {
            setHasError(true); // Will show "Original" placeholder
          }
          return;
        } 
        
        if (version?.stagedUrl) {
          // Try to use the stagedUrl directly
          // If it's a data URL, it should work directly
          // If it's an R2 URL, it might work depending on CORS configuration
          if (mounted) {
            setThumbnailUrl(version.stagedUrl);
          }
        } else {
          if (mounted) {
            setHasError(true);
          }
          return;
        }
      } catch (err) {
        console.error("Failed to load version thumbnail:", err);
        if (mounted) {
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [version, isOriginal]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (hasError || !thumbnailUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xs font-medium">
            {isOriginal ? "Original" : "Preview"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={thumbnailUrl}
      alt="Version thumbnail"
      fill
      className="object-cover"
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: Id<"images">;
  currentVersionId?: Id<"imageVersions">;
  onVersionChange?: (versionId: Id<"imageVersions">) => void;
}

export function VersionsModal({
  isOpen,
  onClose,
  imageId,
  currentVersionId,
  onVersionChange,
}: VersionsModalProps) {
  const [loadingVersionId, setLoadingVersionId] = useState<Id<"imageVersions"> | null>(null);
  const [downloadingVersionId, setDownloadingVersionId] = useState<Id<"imageVersions"> | null>(null);
  const [localCurrentVersionId, setLocalCurrentVersionId] = useState<Id<"imageVersions"> | undefined>(currentVersionId);

  // Update local state when prop changes
  useEffect(() => {
    setLocalCurrentVersionId(currentVersionId);
  }, [currentVersionId]);

  // Fetch all versions for this image
  const versions = useQuery(api.images.listImageVersions, { imageId });
  const setCurrentVersion = useMutation(api.images.setCurrentImageVersion);
  const setPinned = useMutation(api.images.setImageVersionPinned);
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  // Sort versions: original first, then by creation date (newest first)
  const sortedVersions = versions
    ?.slice()
    .sort((a, b) => {
      // Put original (first created) version first
      const aIsOriginal = versions.sort((x, y) => x.createdAt - y.createdAt)[0]._id === a._id;
      const bIsOriginal = versions.sort((x, y) => x.createdAt - y.createdAt)[0]._id === b._id;
      
      if (aIsOriginal && !bIsOriginal) return -1;
      if (!aIsOriginal && bIsOriginal) return 1;
      
      // Then sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    }) || [];

  const handleSetActive = async (versionId: Id<"imageVersions">) => {
    if (loadingVersionId) return;
    
    try {
      setLoadingVersionId(versionId);
      await setCurrentVersion({ imageId, versionId });
      setLocalCurrentVersionId(versionId); // Update local state immediately
      onVersionChange?.(versionId);
    } catch (error) {
      console.error("Failed to set active version:", error);
    } finally {
      setLoadingVersionId(null);
    }
  };

  const handleTogglePin = async (version: ImageVersion) => {
    try {
      await setPinned({
        versionId: version._id,
        pinned: !version.pinned,
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDownload = async (versionId: Id<"imageVersions">, filename: string) => {
    if (downloadingVersionId) return;
    
    try {
      setDownloadingVersionId(versionId);
      
      // Get download URL for this specific version
      const downloadUrl = await getImageDownloadUrl({ 
        imageId, 
        isStaged: true 
      });
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download version:", error);
    } finally {
      setDownloadingVersionId(null);
    }
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
    const date = new Date(version.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
    
    return `${style} • ${decorText} • ${date} ${time}`;
  };

  const getVersionBadges = (version: ImageVersion) => {
    const badges = [];
    
    if (version._id === localCurrentVersionId) {
      badges.push({ 
        icon: Check, 
        label: "Active", 
        variant: "default" as const,
        className: "bg-green-100 text-green-800" 
      });
    }
    
    if (version.pinned) {
      badges.push({ 
        icon: Star, 
        label: "Pinned", 
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800" 
      });
    }
    
    // Check if this is the original version (first created)
    const isOriginal = versions?.length && 
      versions.sort((a, b) => a.createdAt - b.createdAt)[0]._id === version._id;
    if (isOriginal) {
      badges.push({ 
        icon: Lock, 
        label: "Original", 
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800" 
      });
    }
    
    return badges;
  };

  const generateFilename = (version: ImageVersion) => {
    const style = version.stylePreset.toLowerCase().replace(/\s+/g, '_');
    const timestamp = new Date(version.createdAt).toISOString().split('T')[0];
    return `${style}_${timestamp}.jpg`;
  };

  if (!versions || versions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>All Versions ({versions.length})</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {sortedVersions.map((version) => {
              const badges = getVersionBadges(version);
              const isActive = version._id === localCurrentVersionId;
              const isLoading = loadingVersionId === version._id;
              const isDownloading = downloadingVersionId === version._id;
              // Check if this is the original version (first created)
              const isOriginal = !!(versions?.length && 
                versions.sort((a, b) => a.createdAt - b.createdAt)[0]._id === version._id);
              
              return (
                <div
                  key={version._id}
                  className={cn(
                    "relative bg-white border-2 rounded-lg overflow-hidden transition-all",
                    isActive ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {/* Version Thumbnail */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    <VersionThumbnail 
                      version={version}
                      isOriginal={isOriginal} 
                    />
                    
                    {/* Badges Overlay */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      {badges.map((badge, index) => (
                        <Badge
                          key={index}
                          variant={badge.variant}
                          className={cn("text-xs", badge.className)}
                        >
                          <badge.icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleSetActive(version._id)}
                            disabled={isActive || isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            {isActive ? "Currently Active" : "Set Active"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => handleTogglePin(version)}
                          >
                            <Star className={cn("w-4 h-4 mr-2", version.pinned && "fill-current")} />
                            {version.pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => handleDownload(version._id, generateFilename(version))}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Download
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Version Info */}
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {formatVersionLabel(version)}
                    </div>
                    
                    {version.customPrompt && (
                      <div className="text-xs text-gray-600 truncate">
                        Custom: {version.customPrompt}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        {version.aiModel}
                      </div>
                      
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        onClick={() => handleSetActive(version._id)}
                        disabled={isActive || isLoading}
                        className="h-7 px-2 text-xs"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isActive ? (
                          "Active"
                        ) : (
                          "Use This"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {versions.length} version{versions.length !== 1 ? 's' : ''} total
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
