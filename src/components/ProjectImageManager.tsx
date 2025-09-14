"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Image } from "@/types/convex";
import { ImageUploader } from "./ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { 
  Image as ImageIcon, 
  Upload, 
  Grid3X3, 
  List,
  Eye,
  Download,
  Trash2,
  X,
  Wand2,
  Shield
} from "lucide-react";
import { ImageDisplay } from "./ImageDisplay";
import { RoomTypeSelector } from "./RoomTypeSelector";
import { BatchProcessor } from "./BatchProcessor";
import { MLSComplianceDashboard } from "./MLSComplianceDashboard";
import { ComplianceValidator } from "./ComplianceValidator";
import { MLSExportDialog } from "./MLSExportDialog";
import { ImageReviewSystem } from "./ImageReviewSystem";
import { toast } from "sonner";

interface ProjectImageManagerProps {
  projectId: Id<"projects">;
}

export function ProjectImageManager({ projectId }: ProjectImageManagerProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewImageId, setViewImageId] = useState<Id<"images"> | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<Id<"images"> | null>(null);
  const [showMLSExportDialog, setShowMLSExportDialog] = useState(false);
  const [selectedImagesForExport, setSelectedImagesForExport] = useState<Id<"images">[]>([]);

  // Fetch project images
  const images = useQuery(api.images.getProjectImages, { projectId });
  
  // Convex functions
  const deleteImage = useMutation(api.images.deleteImage);
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);
  const updateImageRoomType = useMutation(api.images.updateImageRoomType);

  const handleUploadComplete = (imageIds: Id<"images">[]) => {
    console.log("Upload completed for images:", imageIds);
    // Switch to gallery view after successful upload
    setActiveTab("gallery");
  };

  const handleViewImage = (imageId: Id<"images">) => {
    setViewImageId(imageId);
  };

  const handleDownloadImage = async (imageId: Id<"images">, filename: string, isStaged = false) => {
    try {
      toast.loading("Preparing download...");
      
      const downloadUrl = await getImageDownloadUrl({ imageId, isStaged });
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageId) return;
    
    try {
      await deleteImage({ imageId: deleteImageId });
      toast.success("Image deleted successfully");
      setDeleteImageId(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleRoomTypeChange = async (imageId: Id<"images">, roomType: string) => {
    try {
      await updateImageRoomType({ imageId, roomType });
      toast.success("Room type updated successfully");
    } catch (error) {
      console.error("Room type update failed:", error);
      toast.error("Failed to update room type");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Project Images</h2>
        <div className="flex items-center gap-2">
          {images && images.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Select all staged images for export
                  const stagedImages = images.filter((img: Image) => img.stagedUrl).map((img: Image) => img._id);
                  setSelectedImagesForExport(stagedImages);
                  setShowMLSExportDialog(true);
                }}
                disabled={!images.some((img: Image) => img.stagedUrl)}
              >
                <Shield className="w-4 h-4 mr-1" />
                MLS Export
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Images
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Gallery ({images?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Batch Staging
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Review & Approval
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            MLS Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Room Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                maxFiles={20}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          {!images || images.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No images uploaded yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload some room images to get started with virtual staging.
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{images.length}</div>
                    <div className="text-sm text-gray-500">Total Images</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {images.filter((img: Image) => img.status === "uploaded").length}
                    </div>
                    <div className="text-sm text-gray-500">Ready to Stage</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {images.filter((img: Image) => img.status === "staged").length}
                    </div>
                    <div className="text-sm text-gray-500">Staged</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {images.filter((img: Image) => img.status === "approved").length}
                    </div>
                    <div className="text-sm text-gray-500">Approved</div>
                  </CardContent>
                </Card>
              </div>

              {/* Image Gallery */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {images.map((image: Image) => (
                    <Card key={image._id} className="overflow-hidden">
                      <div className="aspect-square bg-gray-100 relative">
                        <ImageDisplay
                          imageId={image._id}
                          isStaged={image.status === "staged" || image.status === "approved"}
                          className="w-full h-full"
                          alt={image.filename}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className={getRoomTypeColor(image.roomType)}>
                            {image.roomType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Badge className={getStatusColor(image.status)}>
                            {image.status}
                          </Badge>
                          {image.status === "staged" && image.stagedUrl && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                              {image.stagedUrl.startsWith('data:') ? 'AI Generated' : 'Staged'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium truncate" title={image.filename}>
                          {image.filename}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {(image.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                          {image.dimensions.width}×{image.dimensions.height}
                        </p>
                        
                        {/* Room Type Selector */}
                        <div className="mb-3">
                          <RoomTypeSelector
                            filename={image.filename}
                            currentRoomType={image.roomType}
                            onRoomTypeChange={(roomType) => handleRoomTypeChange(image._id, roomType)}
                            metadata={{
                              description: `Image from ${image.filename}`,
                              tags: image.metadata.detectedFeatures || []
                            }}
                            className="text-xs"
                          />
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleViewImage(image._id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadImage(
                              image._id, 
                              image.filename, 
                              image.status === "staged" || image.status === "approved"
                            )}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDeleteImageId(image._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {images.map((image: Image) => (
                        <div key={image._id} className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <ImageDisplay
                              imageId={image._id}
                              isStaged={image.status === "staged" || image.status === "approved"}
                              className="w-full h-full"
                              alt={image.filename}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{image.filename}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {(image.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                              {image.dimensions.width}×{image.dimensions.height}
                            </p>
                            
                            {/* Room Type Selector for List View */}
                            <div className="mb-2">
                              <RoomTypeSelector
                                filename={image.filename}
                                currentRoomType={image.roomType}
                                onRoomTypeChange={(roomType) => handleRoomTypeChange(image._id, roomType)}
                                metadata={{
                                  description: `Image from ${image.filename}`,
                                  tags: image.metadata.detectedFeatures || []
                                }}
                                className="text-xs"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Badge className={getStatusColor(image.status)}>
                                {image.status}
                              </Badge>
                              {image.metadata.confidence !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(image.metadata.confidence * 100)}% confidence
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewImage(image._id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadImage(
                                image._id, 
                                image.filename, 
                                image.status === "staged" || image.status === "approved"
                              )}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setDeleteImageId(image._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <BatchProcessor projectId={projectId} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <ImageReviewSystem projectId={projectId} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <MLSComplianceDashboard projectId={projectId} />
        </TabsContent>
      </Tabs>

      {/* Image View Modal */}
      <Dialog open={!!viewImageId} onOpenChange={() => setViewImageId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle>
                {viewImageId && images?.find((img: Image) => img._id === viewImageId)?.filename}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewImageId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="p-6 pt-0">
            {viewImageId && (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-3xl">
                  <ImageDisplay
                    imageId={viewImageId}
                    isStaged={images?.find((img: Image) => img._id === viewImageId)?.status === "staged" ||
                             images?.find((img: Image) => img._id === viewImageId)?.status === "approved"}
                    className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
                    alt={images?.find((img: Image) => img._id === viewImageId)?.filename || "Image"}
                  />
                </div>
                {viewImageId && images?.find((img: Image) => img._id === viewImageId) && (
                  <div className="mt-4 text-center space-y-2">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>
                        {(images.find((img: Image) => img._id === viewImageId)!.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span>
                        {images.find((img: Image) => img._id === viewImageId)!.dimensions.width}×
                        {images.find((img: Image) => img._id === viewImageId)!.dimensions.height}
                      </span>
                      <span className="capitalize">
                        {images.find((img: Image) => img._id === viewImageId)!.roomType.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* MLS Compliance Validation */}
                    <div className="mt-4 max-w-md mx-auto">
                      <ComplianceValidator
                        imageId={viewImageId}
                        image={images.find((img: Image) => img._id === viewImageId)!}
                        onValidationComplete={() => {
                          // Refresh images data after validation
                          window.location.reload();
                        }}
                      />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          const image = images.find((img: Image) => img._id === viewImageId)!;
                          handleDownloadImage(
                            viewImageId, 
                            image.filename, 
                            image.status === "staged" || image.status === "approved"
                          );
                        }}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => {
                          setViewImageId(null);
                          setDeleteImageId(viewImageId);
                        }}
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteImageId} onOpenChange={() => setDeleteImageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteImageId && images?.find((img: Image) => img._id === deleteImageId)?.filename}&quot;? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MLS Export Dialog */}
      <MLSExportDialog
        isOpen={showMLSExportDialog}
        onClose={() => {
          setShowMLSExportDialog(false);
          setSelectedImagesForExport([]);
        }}
        projectId={projectId}
        selectedImages={selectedImagesForExport}
      />
    </div>
  );
}