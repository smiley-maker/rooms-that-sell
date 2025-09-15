"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Expand,
  ZoomIn,
  GitCompareArrows,
  Sparkles,
  Check,
  Download,
  Shrink,
  Heart,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { VersionsDropdown } from "./VersionsDropdown";
import { cn } from "@/lib/utils";

type CanvasToolbarProps = {
  isOriginalImage: boolean;
  isRegenerating: boolean;
  activeImageId: Id<"images"> | null;
  activeImageStatus?: "staged" | "approved" | "uploaded";
  currentVersionId?: Id<"imageVersions">;
  isRightPanelVisible: boolean;
  isFullscreen: boolean;
  isMultiSelect?: boolean;
  onToggleFullscreen: () => void;
  onToggleRightPanel: () => void;
  onApprove: () => void;
  onShowDownloadDialog: () => void;
  onVersionChange?: (versionId: Id<"imageVersions">) => void;
  onSeeAllVersions?: () => void;
};

export function CanvasToolbar({
  isOriginalImage,
  isRegenerating,
  activeImageId,
  activeImageStatus,
  currentVersionId,
  isRightPanelVisible,
  isFullscreen,
  isMultiSelect = false,
  onToggleFullscreen,
  onToggleRightPanel,
  onApprove,
  onShowDownloadDialog,
  onVersionChange,
  onSeeAllVersions,
}: CanvasToolbarProps) {
  const [isPinning, setIsPinning] = useState(false);

  // Fetch versions to check if current version is pinned
  const versions = useQuery(
    api.images.listImageVersions, 
    activeImageId ? { imageId: activeImageId } : "skip"
  );
  const setPinned = useMutation(api.images.setImageVersionPinned);

  const currentVersion = versions?.find(v => v._id === currentVersionId);
  const isPinned = currentVersion?.pinned || false;

  const handlePinToggle = async () => {
    if (!currentVersionId || isPinning) return;
    
    try {
      setIsPinning(true);
      await setPinned({
        versionId: currentVersionId,
        pinned: !isPinned,
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    } finally {
      setIsPinning(false);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-sm px-4 py-2 flex items-center justify-between gap-4 flex-none">
      <TooltipProvider delayDuration={200}>
        {/* Left: View controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? (
                  <Shrink className="w-5 h-5" />
                ) : (
                  <Expand className="w-5 h-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <ZoomIn className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom 100%</TooltipContent>
          </Tooltip>
          {!isOriginalImage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <GitCompareArrows className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Before/After</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Center: Versions and Progress */}
        <div className="flex-1 flex justify-center items-center px-4 sm:px-8">
          {isRegenerating ? (
            <div className="w-full max-w-xs">
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {isOriginalImage ? "Generating..." : "Regenerating..."}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className="bg-indigo-600 h-1 rounded-full"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          ) : isOriginalImage ? (
            <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
              Original Image
            </span>
          ) : activeImageId ? (
            <VersionsDropdown
              imageId={activeImageId}
              currentVersionId={currentVersionId}
              isDisabled={isMultiSelect}
              onVersionChange={onVersionChange}
              onSeeAllVersions={onSeeAllVersions}
            />
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {!isRightPanelVisible && !isFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-indigo-50 rounded-full transition-colors"
                  onClick={onToggleRightPanel}
                >
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Show Staging Controls</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "p-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                  isPinned 
                    ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                onClick={handlePinToggle}
                disabled={!currentVersionId || isPinning || isMultiSelect}
              >
                <Heart className={cn("w-5 h-5", isPinned && "fill-current")} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {isPinned ? "Unpin Version" : "Pin Version"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onApprove}
                disabled={!activeImageId || activeImageStatus !== "staged"}
              >
                <Check className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Approve (A)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={onShowDownloadDialog}
                disabled={!activeImageId}
              >
                <Download className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}
