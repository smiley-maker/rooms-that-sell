"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
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
  Expand, 
  ZoomIn, 
  GitCompareArrows,
  ChevronDown,
  Sparkles,
  Check,
  Download,
  Star,
  ImageIcon as ImageIconLucide
} from "lucide-react";
import { AuthenticatedNavbar } from "@/components";


export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  // Workspace state
  const [activeImageId, setActiveImageId] = useState<Id<"images"> | null>(null);
  
  // Form state for staging controls
  const [roomType, setRoomType] = useState("kitchen");
  const [stylePreset, setStylePreset] = useState("scandinavian");
  const [includeDecor, setIncludeDecor] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  
  // Collapsible section state
  const [stagedCollapsed, setStagedCollapsed] = useState(false);
  const [approvedCollapsed, setApprovedCollapsed] = useState(false);
  const [uploadedCollapsed, setUploadedCollapsed] = useState(false);

  // Data queries
  const project = useQuery(api.projects.getProject, { projectId });
  const images = useQuery(api.images.getProjectImages, { projectId });
  const currentUser = useQuery(api.users.getCurrentUser);
  const creditStatus = useQuery(api.users.getCreditStatus, currentUser ? { userId: currentUser._id } : "skip");
  
  // Mutations
  const createStagingJob = useMutation(api.stagingJobs.createStagingJob);
  const approveImage = useMutation(api.images.approveImage);

  // Set default active image if none selected
  useEffect(() => {
    if (!activeImageId && images && images.length > 0) {
      setActiveImageId(images[0]._id);
    }
  }, [activeImageId, images]);

  // Update form state when active image changes
  useEffect(() => {
    if (activeImageId && images) {
      const activeImage = images.find(img => img._id === activeImageId);
      if (activeImage) {
        setRoomType(activeImage.roomType || "kitchen");
      }
    }
  }, [activeImageId, images]);

  const activeImage = images?.find(img => img._id === activeImageId);
  const isOriginalImage = activeImage?.status === "uploaded";

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
    if (!activeImageId) return;
    
    setIsRegenerating(true);
    try {
      await createStagingJob({
        projectId,
        imageIds: [activeImageId],
        stylePreset,
        customPrompt: customPrompt || undefined
      });
      // Note: The actual staging will be handled by the job processor
    } catch (error) {
      console.error("Failed to create staging job:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle approve image
  const handleApprove = async () => {
    if (!activeImageId) return;
    
    try {
      await approveImage({ imageId: activeImageId });
    } catch (error) {
      console.error("Failed to approve image:", error);
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
    <div className="min-h-screen bg-[#F3F2F2] p-4 lg:p-6 grid grid-rows-[auto,1fr] gap-4 lg:gap-6">
      <header className="rounded-3xl shadow-sm">
        <AuthenticatedNavbar />
      </header>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full min-h-0">
        {/* Left Rail - Image List */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm p-4 flex flex-col min-h-0 h-full max-h-[calc(100vh-8rem)]">
          <div className="space-y-2 overflow-y-auto flex-1 pr-2 -mr-2 pb-4">
            {/* Staged Section */}
            <div>
              <div 
                className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setStagedCollapsed(!stagedCollapsed)}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${stagedCollapsed ? '-rotate-90' : ''}`} />
                  <span className="text-xl font-bold text-gray-800">staged</span>
                </div>
                <span className="text-sm font-medium text-gray-500">{organizedImages.staged.length}</span>
              </div>
              {!stagedCollapsed && (
                <div className="pt-2 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {organizedImages.staged.map((image) => (
                      <div 
                        key={image._id}
                        className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                          activeImageId === image._id ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        onClick={() => setActiveImageId(image._id)}
                      >
                        <ImageDisplay
                          imageId={image._id}
                          isStaged={true}
                          className="w-full h-full object-cover"
                          alt={image.filename}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Approved Section */}
            <div>
              <div 
                className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setApprovedCollapsed(!approvedCollapsed)}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${approvedCollapsed ? '-rotate-90' : ''}`} />
                  <span className="text-xl font-bold text-gray-800">approved</span>
                </div>
                <span className="text-sm font-medium text-gray-500">{organizedImages.approved.length}</span>
              </div>
              {!approvedCollapsed && (
                <div className="pt-2 pb-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                    {organizedImages.approved.map((image) => (
                      <div 
                        key={image._id}
                        className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                          activeImageId === image._id ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        onClick={() => setActiveImageId(image._id)}
                      >
                        <ImageDisplay
                          imageId={image._id}
                          isStaged={true}
                          className="w-full h-full object-cover"
                          alt={image.filename}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Section */}
            <div>
              <div 
                className="flex items-center justify-between py-2 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => setUploadedCollapsed(!uploadedCollapsed)}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${uploadedCollapsed ? '-rotate-90' : ''}`} />
                  <span className="text-xl font-bold text-gray-800">uploaded</span>
                </div>
                <span className="text-sm font-medium text-gray-500">{organizedImages.uploaded.length}</span>
              </div>
              {!uploadedCollapsed && (
                <div className="pt-2 pb-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-3 gap-2">
                    {organizedImages.uploaded.map((image) => (
                      <div 
                        key={image._id}
                        className={`aspect-square bg-gray-100 rounded-lg border cursor-pointer overflow-hidden relative ${
                          activeImageId === image._id ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-gray-300'
                        }`}
                        onClick={() => setActiveImageId(image._id)}
                      >
                        <ImageDisplay
                          imageId={image._id}
                          isStaged={false}
                          className="w-full h-full object-cover"
                          alt={image.filename}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Add Images Button */}
          <div className="pt-4 mt-auto">
            <button 
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              onClick={() => setShowUploadDialog(true)}
            >
              add images
            </button>
          </div>
        </div>

        {/* Center Column - Canvas */}
        <div className="xl:col-span-6 flex flex-col gap-4 lg:gap-6 min-h-0">
          {/* Canvas Toolbar */}
          <div className="bg-white rounded-xl shadow-sm px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Expand className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <ZoomIn className="w-5 h-5" />
              </button>
              {!isOriginalImage && (
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <GitCompareArrows className="w-5 h-5" />
                </button>
              )}
            </div>
            <div>
              {isOriginalImage ? (
                <span className="px-3 py-1.5 text-sm text-gray-700">Original Image</span>
              ) : (
                <button className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1">
                  Versions: Scandi • Décor ON • 10:48a
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Image Canvas */}
          <div className="bg-white rounded-xl shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-center flex-1">
              {activeImageId ? (
                <div className="w-full h-full">
                  {(() => {
                    const activeImage = images?.find(img => img._id === activeImageId);
                    if (!activeImage) return null;

                    if (activeImage.status === "staged" || activeImage.status === "approved") {
                      return (
                        <ImageComparisonSlider
                          imageId={activeImageId}
                          stagedUrl={activeImage.stagedUrl}
                          className="w-full h-full rounded-lg shadow-inner"
                        />
                      );
                    } else {
                      return (
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          <ImageDisplay
                            imageId={activeImageId}
                            isStaged={false}
                            className="w-full h-full object-cover"
                            alt={activeImage.filename}
                          />
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIconLucide className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select an image to start</p>
                  <p className="text-sm text-gray-500">Choose an image from the left panel to view and stage it.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="bg-white border-t px-6 py-3 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  className="flex flex-col items-center justify-center h-16 w-16 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors gap-1"
                  onClick={() => console.log("Fullscreen clicked")}
                >
                  <Expand className="w-5 h-5" />
                  <span>full screen</span>
                </button>
                
                {isRegenerating ? (
                  <div className="flex flex-col items-center justify-center h-16 w-16 text-xs text-indigo-600 gap-1">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>
                      {isOriginalImage ? "generating" : "regenerating"}
                    </span>
                  </div>
                ) : (
                  <button 
                      className="flex flex-col items-center justify-center h-16 w-16 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors gap-1"
                      onClick={handleRegenerate}
                      disabled={!activeImageId}
                  >
                      <Sparkles className="w-5 h-5" />
                      <span>regenerate</span>
                  </button>
                )}
                
                <button 
                  className="flex flex-col items-center justify-center h-16 w-16 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleApprove}
                  disabled={!activeImageId || activeImage?.status !== "staged"}
                >
                  <Check className="w-5 h-5" />
                  <span>approve</span>
                </button>
                
                <button 
                  className="flex flex-col items-center justify-center h-16 w-16 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setShowDownloadDialog(true)}
                  disabled={!activeImageId}
                >
                  <Download className="w-5 h-5" />
                  <span>download</span>
                </button>
              </div>
              
              {isRegenerating && (
                <div className="flex-1 max-w-xs mx-8">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                credits left: {creditStatus ? `${creditStatus.credits}/${creditStatus.total}` : "..."}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Update Controls */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm flex flex-col min-h-0">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              update image
            </h2>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {activeImageId ? (
              <>
                {/* Room Type */}
                <div>
                  <Label htmlFor="roomType" className="block text-sm font-medium text-gray-700 mb-1.5">room type</Label>
                  <Select value={roomType} onValueChange={setRoomType}>
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
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                  >
                    {isRegenerating 
                      ? (isOriginalImage ? "generating..." : "regenerating...") 
                      : "regenerate staging"
                    }
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">1 token will be used</p>
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
      </div>
      
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
        selectedImages={activeImageId ? [activeImageId] : []}
      />
    </div>
  );
}