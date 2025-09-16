"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Image } from "@/types/convex";
import { ImageDisplay } from "@/components/ImageDisplay";
import { ImageComparisonSlider } from "@/components/ImageComparisonSlider";
import { ImageUploader } from "@/components/ImageUploader";
import { MLSExportDialog } from "@/components/MLSExportDialog";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronDown,
  Sparkles,
  Star,
  ImageIcon as ImageIconLucide,
  CheckCircle2,
  Info
} from "lucide-react";
import { AuthenticatedNavbar } from "@/components";
import { LeftRail } from "@/components/workspace/LeftRail";
import { CanvasToolbar } from "@/components/workspace/CanvasToolbar";
import { FullscreenView } from "@/components/workspace/FullscreenView";
import { VersionsModal } from "@/components/workspace/VersionsModal";


export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  // Workspace state
  const [activeImageId, setActiveImageId] = useState<Id<"images"> | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Id<"images">[]>([]);
  const [pendingImageMap, setPendingImageMap] = useState<Record<string, number>>({});
  const [showBatchComplete, setShowBatchComplete] = useState(false);
  const [lastCompletedCount, setLastCompletedCount] = useState(0);
  const lastBatchCountRef = useRef(0);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form state for staging controls
  const [roomType, setRoomType] = useState("kitchen");
  const [stylePreset, setStylePreset] = useState("scandinavian");
  const [includeDecor, setIncludeDecor] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Version tracking state
  const [localCurrentVersionId, setLocalCurrentVersionId] = useState<Id<"imageVersions"> | undefined>(undefined);
  
  // Collapsible section state
  const [stagedCollapsed, setStagedCollapsed] = useState(false);
  const [approvedCollapsed, setApprovedCollapsed] = useState(false);
  const [uploadedCollapsed, setUploadedCollapsed] = useState(false);

  // Data queries
  const project = useQuery(api.projects.getProject, { projectId });
  const images = useQuery(api.images.getProjectImages, { projectId });

  const selectedImages = useMemo(() => {
    if (!images) return [] as Image[];
    const map = new Map(images.map((img) => [img._id, img] as const));
    return selectedImageIds
      .map((id) => map.get(id))
      .filter((img): img is Image => Boolean(img));
  }, [images, selectedImageIds]);

  const pendingIdStrings = useMemo(() => Object.keys(pendingImageMap), [pendingImageMap]);
  const pendingImageIds = useMemo(
    () => pendingIdStrings.map((id) => id as Id<"images">),
    [pendingIdStrings]
  );
  const pendingIdSet = useMemo(() => new Set(pendingIdStrings), [pendingIdStrings]);

  const isBatchMode = selectedImages.length > 1;
  const hasSelection = selectedImageIds.length > 0;
  const activeIsPending = activeImageId ? pendingIdSet.has(String(activeImageId)) : false;

  const toggleSelectImage = (imageId: Id<"images">) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAllImages = () => {
    if (!images) return;
    setSelectedImageIds(images.map((img) => img._id));
  };

  const clearSelection = () => {
    setSelectedImageIds([]);
  };
  
  // Mutations
  const createStagingJob = useMutation(api.stagingJobs.createStagingJob);
  const approveImage = useMutation(api.images.approveImage);
  const updateRoomTypeMutation = useMutation(api.images.updateImageRoomType);

  // Set default active image if none selected
  useEffect(() => {
    if (!activeImageId && images && images.length > 0) {
      setActiveImageId(images[0]._id);
    }
  }, [activeImageId, images]);

  useEffect(() => {
    if (!images) return;
    const imageSet = new Set(images.map((img) => img._id));
    setSelectedImageIds((prev) => {
      const filtered = prev.filter((id) => imageSet.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [images]);

  useEffect(() => {
    if (selectedImageIds.length > 0) {
      if (!activeImageId || !selectedImageIds.includes(activeImageId)) {
        setActiveImageId(selectedImageIds[0]);
      }
    }
  }, [selectedImageIds, activeImageId]);

  useEffect(() => {
    if (!images) return;
    setPendingImageMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [id, startedAt] of Object.entries(prev)) {
        const image = images.find((img) => String(img._id) === id);
        if (!image) {
          delete next[id];
          changed = true;
          continue;
        }
        if (image.status !== "processing" && image.updatedAt > startedAt) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [images]);

  useEffect(() => {
    if (pendingIdStrings.length === 0 && lastBatchCountRef.current > 0) {
      setLastCompletedCount(lastBatchCountRef.current);
      setShowBatchComplete(true);
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      completionTimeoutRef.current = setTimeout(() => setShowBatchComplete(false), 3000);
      lastBatchCountRef.current = 0;
    }
  }, [pendingIdStrings]);

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  // Update form state when active image changes
  useEffect(() => {
    if (activeImageId && images) {
      const activeImage = images.find(img => img._id === activeImageId);
      if (activeImage) {
        setRoomType(activeImage.roomType || "kitchen");
        setLocalCurrentVersionId(activeImage.currentVersionId);
      }
    }
  }, [activeImageId, images]);

  // Handle responsive right panel
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsRightPanelVisible(false);
      } else {
        setIsRightPanelVisible(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeImage = images?.find(img => img._id === activeImageId);
  const isOriginalImage = !isBatchMode && activeImage?.status === "uploaded";

  // Organize images by status
  const organizedImages = {
    staged: images?.filter((img: Image) => img.status === "staged") || [],
    approved: images?.filter((img: Image) => img.status === "approved") || [],
    uploaded: images?.filter((img: Image) => img.status === "uploaded") || []
  };

  if (project === undefined || images === undefined) {
    return <DashboardSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Project Not Found</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
    );
  }

  // Handle regenerate staging
  const handleRegenerate = async () => {
    const targetImageIds = selectedImageIds.length > 0
      ? selectedImageIds
      : activeImageId
        ? [activeImageId]
        : [];

    if (targetImageIds.length === 0) return;

    const startTimestamp = Date.now();
    setPendingImageMap((prev) => {
      const next = { ...prev };
      targetImageIds.forEach((id) => {
        next[String(id)] = startTimestamp;
      });
      return next;
    });
    if (targetImageIds.length > 1) {
      lastBatchCountRef.current = targetImageIds.length;
    } else {
      lastBatchCountRef.current = 0;
    }
    setShowBatchComplete(false);
    setIsRegenerating(true);
    try {
      await createStagingJob({
        projectId,
        imageIds: targetImageIds,
        stylePreset,
        customPrompt: customPrompt || undefined
      });
      // Note: The actual staging will be handled by the job processor
    } catch (error) {
      console.error("Failed to create staging job:", error);
      setPendingImageMap((prev) => {
        const next = { ...prev };
        targetImageIds.forEach((id) => {
          if (next[String(id)] === startTimestamp) {
            delete next[String(id)];
          }
        });
        return next;
      });
      lastBatchCountRef.current = 0;
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle approve image
  const handleApprove = async () => {
    if (!activeImageId || selectedImageIds.length > 1) return;
    
    try {
      await approveImage({ imageId: activeImageId });
    } catch (error) {
      console.error("Failed to approve image:", error);
    }
  };

  // Handle version change
  const handleVersionChange = async (versionId: Id<"imageVersions">) => {
    if (!activeImageId) return;
    
    try {
      // Update local state immediately for responsive UI
      setLocalCurrentVersionId(versionId);
      // The setCurrentImageVersion mutation is handled by the VersionsDropdown
      // We just need to refresh the UI, which will happen automatically through Convex reactivity
      console.log("Version changed to:", versionId);
    } catch (error) {
      console.error("Failed to change version:", error);
    }
  };

  // Handle upload complete
  const handleUploadComplete = (imageIds: Id<"images">[]) => {
    console.log("Upload completed for images:", imageIds);
    setShowUploadDialog(false);
    // Set the first uploaded image as active
    if (imageIds.length > 0) {
      setActiveImageId(imageIds[0]);
    }
  };

  return (
    <div className="h-screen bg-[#F3F2F2] p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
      <header className="flex-none sticky top-0 z-40 h-16 rounded-full shadow-sm bg-white/80 backdrop-blur">
        <AuthenticatedNavbar />
      </header>
      
      <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        <LeftRail
          organizedImages={organizedImages}
          activeImageId={activeImageId}
          setActiveImageId={setActiveImageId}
          selectedImageIds={selectedImageIds}
          pendingImageIds={pendingImageIds}
          onToggleSelect={toggleSelectImage}
          onSelectAll={selectAllImages}
          onClearSelection={clearSelection}
          stagedCollapsed={stagedCollapsed}
          setStagedCollapsed={setStagedCollapsed}
          approvedCollapsed={approvedCollapsed}
          setApprovedCollapsed={setApprovedCollapsed}
          uploadedCollapsed={uploadedCollapsed}
          setUploadedCollapsed={setUploadedCollapsed}
          onAddImages={() => setShowUploadDialog(true)}
        />

        {/* Center Column - Canvas */}
        <div className={`transition-all duration-300 ${isRightPanelVisible ? 'xl:col-span-6' : 'xl:col-span-9'} flex flex-col gap-4 lg:gap-6 min-h-0`}>
          {showBatchComplete && (
            <div className="mx-auto flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4" /> Updated {lastCompletedCount} image{lastCompletedCount === 1 ? "" : "s"}
            </div>
          )}
          <CanvasToolbar
            isOriginalImage={isOriginalImage}
            isRegenerating={isRegenerating}
            activeImageId={activeImageId}
            activeImageStatus={activeImage?.status as "staged" | "approved" | "uploaded" | undefined}
            currentVersionId={localCurrentVersionId}
            isRightPanelVisible={isRightPanelVisible}
            isFullscreen={isFullscreen}
            isMultiSelect={isBatchMode}
            selectedCount={isBatchMode ? selectedImages.length : undefined}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
            onApprove={handleApprove}
            onShowDownloadDialog={() => setShowDownloadDialog(true)}
            onVersionChange={handleVersionChange}
            onSeeAllVersions={() => setShowVersionsModal(true)}
          />

          {/* Image Canvas */}
          <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-center flex-1 h-full p-4">
              {isBatchMode ? (
                <div className="h-full w-full overflow-y-auto">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      Batch editing • {selectedImages.length} images selected
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                      <Info className="h-3.5 w-3.5 text-gray-500" />
                      <span className="leading-none">Click any card to focus it, open fullscreen, or tweak versions while keeping batch settings.</span>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(140px,_1fr)]">
                    {selectedImages.map((image) => {
                      const isPending = pendingIdSet.has(String(image._id));
                      return (
                        <div
                          key={image._id}
                          className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:border-indigo-200"
                          onClick={() => setActiveImageId(image._id)}
                          title="Open this image for detailed controls"
                        >
                          <div className="relative flex-1 overflow-hidden bg-gray-100">
                            <ImageDisplay
                              key={`${image._id}-${image.updatedAt}`}
                              imageId={image._id}
                              isStaged={Boolean(image.stagedUrl)}
                              className="h-full w-full object-cover"
                              alt={image.filename}
                            />
                            {!image.stagedUrl && (
                              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700">
                                pending staging
                              </span>
                            )}
                            {isPending && (
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                              </div>
                            )}
                          </div>
                          <div className="border-t bg-white px-3 py-2 text-xs text-gray-600 truncate">
                            {image.filename}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeImage ? (
                <div className="relative flex h-full w-full items-center justify-center">
                  {(() => {
                    if (!activeImageId || !activeImage) return null;

                    const aspectRatio = activeImage.dimensions.width && activeImage.dimensions.height
                      ? `${activeImage.dimensions.width} / ${activeImage.dimensions.height}`
                      : "16 / 9";

                    return (
                      <div style={{ aspectRatio }} className="h-auto max-h-full w-full">
                        {activeImage.status === "staged" || activeImage.status === "approved" ? (
                          <ImageComparisonSlider
                            key={`${activeImageId}-${activeImage.updatedAt}`}
                            imageId={activeImageId}
                            stagedUrl={activeImage.stagedUrl}
                            className="h-full w-full rounded-lg object-contain shadow-inner"
                          />
                        ) : (
                          <ImageDisplay
                            key={`${activeImageId}-${activeImage.updatedAt}`}
                            imageId={activeImageId}
                            isStaged={false}
                            className="h-full w-full rounded-lg object-contain"
                            alt={activeImage.filename}
                          />
                        )}
                        {activeIsPending && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIconLucide className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <p className="text-lg font-medium">Select an image to start</p>
                  <p className="text-sm text-gray-500">Choose an image from the left panel to view and stage it.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Update Controls */}
        {isRightPanelVisible && (
          <div className="xl:col-span-3 bg-white rounded-xl shadow-sm flex flex-col min-h-0 h-full transition-all duration-300">
            <div className="px-6 py-4 border-b flex items-center justify-between flex-none">
              <h2 className="text-lg font-semibold text-gray-900">
                update image
              </h2>
              <button 
                className="p-1 text-gray-500 hover:text-gray-800 xl:hidden"
                onClick={() => setIsRightPanelVisible(false)}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {activeImageId ? (
                <>
                  {isBatchMode && (
                    <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                      Applying updates to <strong>{selectedImages.length}</strong> images.
                      Regenerate will queue staging jobs for every selected photo using the settings below.
                      <span className="mt-1 block text-xs text-indigo-700/80">
                        Need a closer look? Select a thumbnail to inspect, tweak versions, or open fullscreen without leaving batch mode.
                      </span>
                    </div>
                  )}

                  {/* Room Type */}
                  <div>
                    <Label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1.5">room type</Label>
                    <Select
                      value={roomType}
                      onValueChange={async (value) => {
                        setRoomType(value);

                        if (!activeImageId) {
                          return;
                        }

                        const active = images?.find((img) => img._id === activeImageId);
                        if (active && active.roomType === value) {
                          return;
                        }

                        try {
                          await updateRoomTypeMutation({ imageId: activeImageId, roomType: value });
                        } catch (error) {
                          console.error("Failed to update room type:", error);
                        }
                      }}
                    >
                      <SelectTrigger id="roomType" className="w-full capitalize bg-gray-50 border-gray-200 hover:bg-gray-100">
                        <SelectValue placeholder="Select a room type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kitchen">kitchen</SelectItem>
                        <SelectItem value="living_room">living room</SelectItem>
                        <SelectItem value="bedroom">bedroom</SelectItem>
                        <SelectItem value="bathroom">bathroom</SelectItem>
                        <SelectItem value="dining_room">dining room</SelectItem>
                        <SelectItem value="office">office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interior Design Style */}
                  <div>
                    <Label htmlFor="designStyle" className="block text-sm font-medium text-gray-700 mb-1.5">interior design style</Label>
                    <Select value={stylePreset} onValueChange={setStylePreset}>
                      <SelectTrigger id="designStyle" className="w-full capitalize bg-gray-50 border-gray-200 hover:bg-gray-100">
                        <SelectValue placeholder="Select a style..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scandinavian">scandinavian</SelectItem>
                        <SelectItem value="modern">modern</SelectItem>
                        <SelectItem value="minimal">minimal</SelectItem>
                        <SelectItem value="bohemian">bohemian</SelectItem>
                        <SelectItem value="traditional">traditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Include Décor Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="includeDecor" className="text-sm font-medium text-gray-700">include decor?</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">no</span>
                      <Switch
                        id="includeDecor"
                        checked={includeDecor}
                        onCheckedChange={setIncludeDecor}
                      />
                      <span className="text-sm text-gray-500">yes</span>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <button 
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      advanced options
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-2">Custom Prompt</Label>
                          <Textarea
                            id="customPrompt"
                            className="w-full text-sm resize-none bg-gray-50 border-gray-200"
                            rows={4}
                            placeholder="e.g. 'add a large plant in the corner', 'make the sofa green'"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                          />
                        </div>
                        <button className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1.5 p-2 -ml-2 rounded-md hover:bg-yellow-50 transition-colors">
                          <Star className="w-4 h-4" />
                          save this setup as a style
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Regenerate Button */}
                  <div className="pt-4">
                    <button 
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{isOriginalImage ? "Generating..." : "Regenerating..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {isBatchMode
                              ? `Apply Style to ${selectedImages.length} Images`
                              : "Regenerate Staging"}
                          </span>
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {isBatchMode
                        ? `${selectedImages.length} credits will be used`
                        : "1 credit will be used"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <ImageIconLucide className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm font-medium">Select an image to edit styles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <FullscreenView
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        activeImage={activeImage}
        isRegenerating={isRegenerating}
        isRightPanelVisible={isRightPanelVisible}
        onToggleRightPanel={() => setIsRightPanelVisible(!isRightPanelVisible)}
        onApprove={handleApprove}
        onShowDownloadDialog={() => setShowDownloadDialog(true)}
      />

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ImageUploader
              projectId={projectId}
              onUploadComplete={handleUploadComplete}
              maxFiles={20}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      <MLSExportDialog
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        projectId={projectId}
        selectedImages={hasSelection ? selectedImageIds : activeImageId ? [activeImageId] : []}
      />

      {/* Versions Modal */}
      {activeImageId && (
        <VersionsModal
          isOpen={showVersionsModal}
          onClose={() => setShowVersionsModal(false)}
          imageId={activeImageId}
            currentVersionId={localCurrentVersionId}
          onVersionChange={handleVersionChange}
        />
      )}
    </div>
  );
}
