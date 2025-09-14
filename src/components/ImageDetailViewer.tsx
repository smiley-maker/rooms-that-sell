"use client";

import React, { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  X, 
  Download, 
  Info, 
  Palette, 
  Cpu, 
  FileImage,
  Ruler,
  Tag,
  Calendar,
  Shield
} from "lucide-react";
import { ImageComparisonSlider } from "./ImageComparisonSlider";
import { ImageApprovalWorkflow } from "./ImageApprovalWorkflow";
import { ComplianceValidator } from "./ComplianceValidator";
import { toast } from "sonner";

interface ImageDetailViewerProps {
  imageId: Id<"images">;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageDetailViewer({ imageId, isOpen, onClose }: ImageDetailViewerProps) {
  const [activeTab, setActiveTab] = useState("comparison");

  // Fetch image data
  const image = useQuery(api.images.getImageById, { imageId });
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  const handleDownload = async (isStaged = false) => {
    if (!image) return;
    
    try {
      toast.loading("Preparing download...");
      
      const downloadUrl = await getImageDownloadUrl({ imageId, isStaged });
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = isStaged 
        ? `${image.filename.replace(/\.[^/.]+$/, "")}_staged.jpg`
        : image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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

  if (!image) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              {image.filename}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Image Comparison */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Before & After Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <ImageComparisonSlider
                          imageId={imageId}
                          originalUrl={image.originalUrl}
                          stagedUrl={image.stagedUrl}
                          className="w-full h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions & Status */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status & Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Badge className={getStatusColor(image.status)}>
                          {image.status}
                        </Badge>
                      </div>

                      {(image.status === "staged" || image.status === "approved") && (
                        <ImageApprovalWorkflow
                          imageId={imageId}
                          currentStatus={image.status}
                          onStatusChange={() => {
                            // Status will update via Convex reactivity
                          }}
                        />
                      )}

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDownload(false)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Original
                        </Button>
                        
                        {image.stagedUrl && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownload(true)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Staged
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Room:</span>
                        <Badge variant="outline">
                          {image.roomType.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Size:</span>
                        <span>{image.dimensions.width}×{image.dimensions.height}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <FileImage className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">File Size:</span>
                        <span>{formatFileSize(image.fileSize)}</span>
                      </div>

                      {image.metadata.stylePreset && (
                        <div className="flex items-center gap-2 text-sm">
                          <Palette className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Style:</span>
                          <Badge variant="outline">
                            {image.metadata.stylePreset}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Filename</label>
                      <p className="text-sm break-all">{image.filename}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">File Size</label>
                      <p className="text-sm">{formatFileSize(image.fileSize)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dimensions</label>
                      <p className="text-sm">{image.dimensions.width} × {image.dimensions.height} pixels</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room Type</label>
                      <p className="text-sm capitalize">{image.roomType.replace('_', ' ')}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge className={getStatusColor(image.status)}>
                        {image.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Processing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      Processing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {image.metadata.confidence !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Detection Confidence</label>
                        <p className="text-sm">{Math.round(image.metadata.confidence * 100)}%</p>
                      </div>
                    )}
                    
                    {image.metadata.processingTime && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Processing Time</label>
                        <p className="text-sm">{(image.metadata.processingTime / 1000).toFixed(2)}s</p>
                      </div>
                    )}
                    
                    {image.metadata.stylePreset && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Style Preset</label>
                        <p className="text-sm capitalize">{image.metadata.stylePreset}</p>
                      </div>
                    )}
                    
                    {image.metadata.aiModel && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">AI Model</label>
                        <p className="text-sm">{image.metadata.aiModel}</p>
                      </div>
                    )}
                    
                    {image.metadata.detectedFeatures && image.metadata.detectedFeatures.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Detected Features</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {image.metadata.detectedFeatures.map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm">{formatDate(image.createdAt)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-sm">{formatDate(image.updatedAt)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="w-5 h-5" />
                      Storage Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Original URL</label>
                      <p className="text-xs break-all text-gray-600">{image.originalUrl}</p>
                    </div>
                    
                    {image.stagedUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Staged URL</label>
                        <p className="text-xs break-all text-gray-600">
                          {image.stagedUrl.startsWith('data:') 
                            ? 'Data URL (AI Generated)' 
                            : image.stagedUrl
                          }
                        </p>
                      </div>
                    )}
                    
                    {image.imageKey && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Storage Key</label>
                        <p className="text-xs break-all text-gray-600">{image.imageKey}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    MLS Compliance Check
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ComplianceValidator
                    imageId={imageId}
                    image={image}
                    onValidationComplete={() => {
                      // Refresh will happen via Convex reactivity
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}