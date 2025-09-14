"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent } from "./ui/tabs";
import { 
  CheckCircle, 
  Eye, 
  Grid3X3, 
  Kanban,
  Download,
  Info
} from "lucide-react";
import { ImageComparisonSlider } from "./ImageComparisonSlider";
import { ImageDetailViewer } from "./ImageDetailViewer";
import { ImageApprovalWorkflow } from "./ImageApprovalWorkflow";

interface ImageReviewSystemProps {
  projectId: Id<"projects">;
}

export function ImageReviewSystem({ projectId }: ImageReviewSystemProps) {
  const [viewMode, setViewMode] = useState<"gallery" | "kanban">("gallery");
  const [selectedImageId, setSelectedImageId] = useState<Id<"images"> | null>(null);
  const [showDetailViewer, setShowDetailViewer] = useState(false);

  // Fetch project images
  const images = useQuery(api.images.getProjectImages, { projectId });
  
  // Filter images that have been staged
  const stagedImages = images?.filter(img => 
    img.status === "staged" || img.status === "approved" || img.status === "exported"
  ) || [];

  const handleImageSelect = (imageId: Id<"images">) => {
    setSelectedImageId(imageId);
    setShowDetailViewer(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "staged": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "exported": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "staged": return <Eye className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "exported": return <Download className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  if (!images) {
    return <div>Loading...</div>;
  }

  if (stagedImages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No staged images to review
          </h3>
          <p className="text-gray-500">
            Stage some images first to see them here for review and approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Image Review & Approval</h2>
          <p className="text-gray-600">
            Review staged images and approve them for export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "gallery" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("gallery")}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            Gallery
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <Kanban className="w-4 h-4 mr-1" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stagedImages.filter(img => img.status === "staged").length}
            </div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stagedImages.filter(img => img.status === "approved").length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stagedImages.filter(img => img.status === "exported").length}
            </div>
            <div className="text-sm text-gray-500">Exported</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "gallery" | "kanban")}>
        <TabsContent value="gallery" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stagedImages.map((image) => (
              <Card key={image._id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  <ImageComparisonSlider
                    imageId={image._id}
                    originalUrl={image.originalUrl}
                    stagedUrl={image.stagedUrl}
                    className="w-full h-full"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={getStatusColor(image.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(image.status)}
                        {image.status}
                      </span>
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium truncate mb-2" title={image.filename}>
                    {image.filename}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {image.roomType.replace('_', ' ')}
                    </Badge>
                    {image.metadata.stylePreset && (
                      <Badge variant="outline" className="text-xs">
                        {image.metadata.stylePreset}
                      </Badge>
                    )}
                  </div>
                  <ImageApprovalWorkflow
                    imageId={image._id}
                    currentStatus={image.status}
                    onStatusChange={() => {
                      // Refresh will happen automatically via Convex reactivity
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleImageSelect(image._id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staged Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Staged ({stagedImages.filter(img => img.status === "staged").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stagedImages
                  .filter(img => img.status === "staged")
                  .map((image) => (
                    <Card key={image._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                          <ImageComparisonSlider
                            imageId={image._id}
                            originalUrl={image.originalUrl}
                            stagedUrl={image.stagedUrl}
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-sm font-medium truncate mb-1">
                          {image.filename}
                        </p>
                        <Badge variant="outline" className="text-xs mb-2">
                          {image.roomType.replace('_', ' ')}
                        </Badge>
                        <ImageApprovalWorkflow
                          imageId={image._id}
                          currentStatus={image.status}
                          onStatusChange={() => {}}
                          compact
                        />
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>

            {/* Approved Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Approved ({stagedImages.filter(img => img.status === "approved").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stagedImages
                  .filter(img => img.status === "approved")
                  .map((image) => (
                    <Card key={image._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                          <ImageComparisonSlider
                            imageId={image._id}
                            originalUrl={image.originalUrl}
                            stagedUrl={image.stagedUrl}
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-sm font-medium truncate mb-1">
                          {image.filename}
                        </p>
                        <Badge variant="outline" className="text-xs mb-2">
                          {image.roomType.replace('_', ' ')}
                        </Badge>
                        <ImageApprovalWorkflow
                          imageId={image._id}
                          currentStatus={image.status}
                          onStatusChange={() => {}}
                          compact
                        />
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>

            {/* Exported Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-purple-600" />
                  Exported ({stagedImages.filter(img => img.status === "exported").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stagedImages
                  .filter(img => img.status === "exported")
                  .map((image) => (
                    <Card key={image._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                          <ImageComparisonSlider
                            imageId={image._id}
                            originalUrl={image.originalUrl}
                            stagedUrl={image.stagedUrl}
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-sm font-medium truncate mb-1">
                          {image.filename}
                        </p>
                        <Badge variant="outline" className="text-xs mb-2">
                          {image.roomType.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleImageSelect(image._id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Viewer Modal */}
      {selectedImageId && (
        <ImageDetailViewer
          imageId={selectedImageId}
          isOpen={showDetailViewer}
          onClose={() => {
            setShowDetailViewer(false);
            setSelectedImageId(null);
          }}
        />
      )}
    </div>
  );
}