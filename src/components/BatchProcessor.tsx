"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Image, StagingJob } from "@/types/convex";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { 
  Wand2, 
  Image as ImageIcon,
  AlertCircle,
  CreditCard,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { BatchSelector } from "./BatchSelector";
import { StylePalette, STYLE_PRESETS } from "./StylePalette";
import { StagingProgress } from "./StagingProgress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BatchProcessorProps {
  projectId: Id<"projects">;
  className?: string;
}

export function BatchProcessor({ projectId, className }: BatchProcessorProps) {
  const [selectedImageIds, setSelectedImageIds] = useState<Id<"images">[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data
  const images = useQuery(api.images.getProjectImages, { projectId });
  const user = useQuery(api.users.getCurrentUser);
  const activeStagingJobs = useQuery(api.stagingJobsSimple.getActiveStagingJobs, { projectId });

  // Mutations
  const createStagingJob = useMutation(api.stagingJobsSimple.createStagingJob);
  const triggerStuckJobRecovery = useAction(api.stagingJobsSimple.triggerStuckJobRecovery);
  const migrateAllQueuedJobs = useAction(api.stagingJobsSimple.migrateAllQueuedJobs);

  // Filter images that can be staged
  const stageableImages = images?.filter((img: Image) => img.status === "uploaded") || [];

  const handleStartBatchProcessing = async () => {
    if (selectedImageIds.length === 0) {
      toast.error("Please select at least one image to process");
      return;
    }

    if (!selectedStyle) {
      toast.error("Please select a style preset");
      return;
    }

    if (!user) {
      toast.error("User not found");
      return;
    }

    // Check if user has enough credits
    if (user.credits < selectedImageIds.length) {
      toast.error(`Insufficient credits. You need ${selectedImageIds.length} credits but only have ${user.credits}.`);
      return;
    }

    setIsProcessing(true);

    try {
      await createStagingJob({
        projectId,
        imageIds: selectedImageIds,
        stylePreset: selectedStyle,
        customPrompt: customPrompt.trim() || undefined,
      });

      toast.success(`Batch staging job started! Processing ${selectedImageIds.length} images.`);
      
      // Reset form
      setSelectedImageIds([]);
      setSelectedStyle("");
      setCustomPrompt("");
      
    } catch (error) {
      console.error("Failed to start batch processing:", error);
      toast.error("Failed to start batch processing. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedStylePreset = () => {
    return STYLE_PRESETS.find(preset => preset.id === selectedStyle);
  };

  const canStartProcessing = selectedImageIds.length > 0 && selectedStyle && !isProcessing;
  const estimatedCredits = selectedImageIds.length;

  const handleRecoverStuckJobs = async () => {
    try {
      const result = await triggerStuckJobRecovery();
      if (result.stuckJobsFound > 0) {
        toast.success(`Found and restarted ${result.stuckJobsFound} stuck job(s)`);
      } else {
        toast.info("No stuck jobs found");
      }
    } catch (error) {
      console.error("Failed to recover stuck jobs:", error);
      toast.error("Failed to recover stuck jobs");
    }
  };

  const handleMigrateAllJobs = async () => {
    try {
      const result = await migrateAllQueuedJobs();
      if (result.totalFound > 0) {
        toast.success(`Migrated ${result.totalScheduled}/${result.totalFound} queued job(s)`);
      } else {
        toast.info("No queued jobs found to migrate");
      }
    } catch (error) {
      console.error("Failed to migrate jobs:", error);
      toast.error("Failed to migrate jobs");
    }
  };

  if (!images || !user) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Active Jobs */}
      {activeStagingJobs && activeStagingJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Staging Jobs</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecoverStuckJobs}
                className="text-xs"
              >
                Restart Stuck Jobs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMigrateAllJobs}
                className="text-xs"
              >
                Migrate All Queued
              </Button>
            </div>
          </div>
          {activeStagingJobs.map((job: StagingJob) => (
            <StagingProgress
              key={job._id}
              job={job}
              images={images}
            />
          ))}
        </div>
      )}

      {/* Batch Processing Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Batch AI Staging
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select multiple images and apply consistent styling across your entire project
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Credit Balance */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Available Credits: {user.credits}</span>
            </div>
            {estimatedCredits > 0 && (
              <div className="text-sm text-blue-700">
                {estimatedCredits} credit{estimatedCredits !== 1 ? 's' : ''} will be used
              </div>
            )}
          </div>

          {/* Image Selection */}
          <BatchSelector
            images={stageableImages}
            selectedImageIds={selectedImageIds}
            onSelectionChange={setSelectedImageIds}
            maxSelection={user.credits} // Limit selection to available credits
          />

          {/* Style Selection */}
          {selectedImageIds.length > 0 && (
            <div className="space-y-4">
              <StylePalette
                selectedStyle={selectedStyle}
                onStyleSelect={setSelectedStyle}
              />

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">
                  Custom Styling Instructions (Optional)
                </Label>
                <Textarea
                  id="customPrompt"
                  placeholder="Add specific styling instructions, color preferences, or furniture types..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {customPrompt.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Processing Summary */}
          {selectedImageIds.length > 0 && selectedStyle && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">
                    Ready to Process {selectedImageIds.length} Image{selectedImageIds.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>Style:</span>
                      <Badge className={getSelectedStylePreset()?.color}>
                        {getSelectedStylePreset()?.name}
                      </Badge>
                    </div>
                    <div>Credits required: {estimatedCredits}</div>
                    {customPrompt && (
                      <div>Custom instructions: &quot;{customPrompt.substring(0, 50)}{customPrompt.length > 50 ? '...' : ''}&quot;</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insufficient Credits Warning */}
          {user.credits < estimatedCredits && estimatedCredits > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">
                    Insufficient Credits
                  </h4>
                  <p className="text-sm text-red-700">
                    You need {estimatedCredits} credits but only have {user.credits}. 
                    Please reduce your selection or upgrade your plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedImageIds.length === 0 && "Select images to get started"}
              {selectedImageIds.length > 0 && !selectedStyle && "Choose a style preset"}
              {selectedImageIds.length > 0 && selectedStyle && "Ready to process"}
            </div>
            
            <Button
              onClick={handleStartBatchProcessing}
              disabled={!canStartProcessing || user.credits < estimatedCredits}
              size="lg"
              className="min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Start Staging
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Images Message */}
      {stageableImages.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No images ready for staging
            </h3>
            <p className="text-gray-500 mb-4">
              {images && images.length > 0 
                ? `You have ${images.length} images, but none are ready for staging. Images need to have "uploaded" status to be staged.`
                : "Upload some room images to start batch processing with AI staging."
              }
            </p>
            {images && images.length > 0 && (
              <div className="text-sm text-gray-400 mt-4">
                <p>Current image statuses:</p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[...new Set(images?.map((img: Image) => img.status) || [])].map((status: string) => (
                    <Badge key={status} variant="outline">
                      {status}: {images?.filter((img: Image) => img.status === status).length || 0}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}