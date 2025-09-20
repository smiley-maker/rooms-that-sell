"use client";

import { useEffect, useState } from "react";
import { Image, ProjectVideo } from "@/types/convex";
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
  activeVideo?: ProjectVideo | null;
  isVideoProcessing?: boolean;
  onGenerateVideo?: () => void;
  onDownloadVideo?: () => void;
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
  activeVideo,
  isVideoProcessing = false,
  onGenerateVideo,
  onDownloadVideo,
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

  const [activeTab, setActiveTab] = useState<"images" | "video">("images");
  const hasVideo = Boolean(activeVideo && activeVideo.status === "completed" && activeVideo.videoUrl);
  const showVideoTab = hasVideo || isVideoProcessing;

  useEffect(() => {
    if (!showVideoTab && activeTab === "video") {
      setActiveTab("images");
    }
  }, [showVideoTab, activeTab]);

  const isOriginalImage = activeImage.status === "uploaded";
  const aspectRatio = activeImage.dimensions.width && activeImage.dimensions.height ? `${activeImage.dimensions.width} / ${activeImage.dimensions.height}` : "16 / 9";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 lg:p-8">
      <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 text-sm text-white/80">
          <button
            className={`px-3 py-1 rounded-full transition ${activeTab === "images" ? "bg-white text-black" : "hover:bg-white/10"}`}
            onClick={() => setActiveTab("images")}
          >
            Images
          </button>
          {showVideoTab && (
            <button
              className={`px-3 py-1 rounded-full transition ${activeTab === "video" ? "bg-white text-black" : "hover:bg-white/10"}`}
              onClick={() => setActiveTab("video")}
            >
              {isVideoProcessing && !hasVideo ? "Video (processing)" : "Video"}
            </button>
          )}
        </div>

        {/* Viewer */}
        <div className="flex-1 w-full max-h-[85vh] flex items-center justify-center relative">
          {activeTab === "images" ? (
            <div style={{ aspectRatio }} className="relative h-full w-auto max-w-full">
              {activeImage.status === "staged" || activeImage.status === "approved" ? (
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
          ) : (
            <div className="flex h-full w-full max-w-4xl flex-col items-center justify-center gap-4">
              {isVideoProcessing && !hasVideo ? (
                <div className="flex flex-col items-center gap-2 text-white/80">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/70 border-t-transparent"></div>
                  <p className="text-sm">Rendering your video… We&apos;ll refresh this view when it&apos;s ready.</p>
                </div>
              ) : hasVideo && activeVideo?.videoUrl ? (
                <div className="w-full space-y-3">
                  <video
                    key={activeVideo.videoUrl}
                    src={activeVideo.videoUrl}
                    controls
                    className="w-full rounded-xl bg-black"
                  />
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>Generated {new Date(activeVideo.updatedAt).toLocaleString()}</span>
                    {onDownloadVideo && (
                      <button
                        onClick={onDownloadVideo}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                      >
                        Download MP4
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-white/80">
                  <p className="text-sm">No video yet. Generate one from the toolbar.</p>
                  {onGenerateVideo && (
                    <button
                      onClick={onGenerateVideo}
                      className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-semibold hover:bg-white/90"
                    >
                      Generate video
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
            onGenerateVideo={onGenerateVideo}
            canGenerateVideo={!isOriginalImage && Boolean(onGenerateVideo)}
            hasVideo={hasVideo}
            isVideoProcessing={isVideoProcessing}
          />
        </div>
      </div>
    </div>
  );
}
