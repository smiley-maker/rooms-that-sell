"use client";

import { useEffect } from "react";
import { Image } from "@/types/convex";
import { ImageDisplay } from "@/components/ImageDisplay";
import { ImageComparisonSlider } from "@/components/ImageComparisonSlider";
import { CanvasToolbar } from "./CanvasToolbar";

type FullscreenViewProps = {
  isOpen: boolean;
  onClose: () => void;
  activeImage: Image | undefined;
  isRegenerating: boolean;
  isRightPanelVisible: boolean;
  onToggleRightPanel: () => void;
  onApprove: () => void;
  onShowDownloadDialog: () => void;
};

export function FullscreenView({
  isOpen,
  onClose,
  activeImage,
  isRegenerating,
  isRightPanelVisible,
  onToggleRightPanel,
  onApprove,
  onShowDownloadDialog,
}: FullscreenViewProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen || !activeImage) return null;

  const isOriginalImage = activeImage.status === "uploaded";
  const aspectRatio = activeImage.dimensions.width && activeImage.dimensions.height ? `${activeImage.dimensions.width} / ${activeImage.dimensions.height}` : "16 / 9";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
        {/* Image Viewer */}
        <div className="flex-1 w-full max-h-[85vh] flex items-center justify-center relative">
          <div style={{ aspectRatio }} className="relative h-full w-auto max-w-full">
            {activeImage.status === "staged" ||
            activeImage.status === "approved" ? (
              <ImageComparisonSlider
                imageId={activeImage._id}
                stagedUrl={activeImage.stagedUrl}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <ImageDisplay
                imageId={activeImage._id}
                isStaged={false}
                className="w-full h-full object-contain rounded-lg"
                alt={activeImage.filename}
              />
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="w-full max-w-5xl flex-none">
          <CanvasToolbar
            isOriginalImage={isOriginalImage}
            isRegenerating={isRegenerating}
            activeImageId={activeImage._id}
            activeImageStatus={activeImage.status as "staged" | "approved" | "uploaded" | undefined}
            isRightPanelVisible={isRightPanelVisible}
            isFullscreen={true}
            onToggleFullscreen={onClose}
            onToggleRightPanel={onToggleRightPanel}
            onApprove={onApprove}
            onShowDownloadDialog={onShowDownloadDialog}
          />
        </div>
      </div>
    </div>
  );
}
