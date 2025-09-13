"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface StagingJobResult {
  imageId: Id<"images">;
  stagedUrl: string;
  success: boolean;
  error?: string;
}

interface StagingJob {
  _id: Id<"stagingJobs">;
  userId: Id<"users">;
  imageIds: Id<"images">[];
  stylePreset: string;
  customPrompt?: string;
  status: string;
  results?: StagingJobResult[];
  creditsUsed: number;
  createdAt: number;
  completedAt?: number;
}

interface StagingProgressProps {
  job: StagingJob;
  images: Array<{
    _id: Id<"images">;
    filename: string;
    roomType: string;
  }>;
  onRetry?: (jobId: Id<"stagingJobs">) => void;
  onCancel?: (jobId: Id<"stagingJobs">) => void;
  className?: string;
}

export function StagingProgress({ 
  job, 
  images, 
  onRetry, 
  onCancel, 
  className 
}: StagingProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "queued":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "queued":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = () => {
    if (job.status === "queued") return 0;
    if (job.status === "failed") return 0;
    if (job.status === "completed") return 100;
    
    // For processing status, calculate based on results
    if (job.results) {
      return Math.round((job.results.length / job.imageIds.length) * 100);
    }
    
    return 25; // Default processing progress
  };

  const getProcessedCount = () => {
    if (!job.results) return 0;
    return job.results.length;
  };

  const getSuccessCount = () => {
    if (!job.results) return 0;
    return job.results.filter(result => result.success).length;
  };

  const getFailedCount = () => {
    if (!job.results) return 0;
    return job.results.filter(result => !result.success).length;
  };

  const getEstimatedTimeRemaining = () => {
    if (job.status !== "processing") return null;
    
    const processed = getProcessedCount();
    const remaining = job.imageIds.length - processed;
    
    if (processed === 0) return "Estimating...";
    
    const elapsed = Date.now() - job.createdAt;
    const avgTimePerImage = elapsed / processed;
    const estimatedRemaining = (avgTimePerImage * remaining) / 1000; // Convert to seconds
    
    if (estimatedRemaining < 60) {
      return `~${Math.round(estimatedRemaining)}s remaining`;
    } else {
      return `~${Math.round(estimatedRemaining / 60)}m remaining`;
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const seconds = Math.round(duration / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(job.status)}
            Staging Progress
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
            {job.status === "processing" && onCancel && (
              <Button variant="outline" size="sm" onClick={() => onCancel(job._id)}>
                Cancel
              </Button>
            )}
            {job.status === "failed" && onRetry && (
              <Button variant="outline" size="sm" onClick={() => onRetry(job._id)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              {getProcessedCount()} of {job.imageIds.length} images processed
            </span>
            <span className="text-muted-foreground">
              {getProgressPercentage()}%
            </span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Style</div>
            <div className="font-medium capitalize">{job.stylePreset}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Credits Used</div>
            <div className="font-medium">{job.creditsUsed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Duration</div>
            <div className="font-medium">
              {formatDuration(job.createdAt, job.completedAt)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium">
              {job.status === "processing" && getEstimatedTimeRemaining()}
              {job.status === "completed" && "Completed"}
              {job.status === "failed" && "Failed"}
              {job.status === "queued" && "In Queue"}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {job.results && job.results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>{getSuccessCount()} successful</span>
              </div>
              {getFailedCount() > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>{getFailedCount()} failed</span>
                </div>
              )}
            </div>

            {/* Individual Image Results */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Image Results</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {job.results.map((result) => {
                  const image = images.find(img => img._id === result.imageId);
                  return (
                    <div
                      key={result.imageId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {image?.filename || "Unknown image"}
                        </span>
                        {image?.roomType && (
                          <Badge variant="outline" className="text-xs">
                            {image.roomType.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {result.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            {result.error && (
                              <span className="text-xs" title={result.error}>
                                Error
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Details */}
        {job.status === "failed" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-red-800 mb-1">
                  Staging job failed
                </div>
                <div className="text-red-700">
                  The batch staging process encountered an error. You can retry the job or contact support if the issue persists.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        {job.customPrompt && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">Custom Prompt</div>
              <div className="text-blue-700">{job.customPrompt}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}