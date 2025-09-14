import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  const currentIndex = currentStep ? steps.findIndex(step => step.id === currentStep) : -1;
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      <Progress value={progress} className="h-2" />
      
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.status === "completed";
          const isError = step.status === "error";
          const isPending = step.status === "pending";
          const isInProgress = step.status === "in-progress";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isActive && "bg-blue-50 border border-blue-200",
                isCompleted && "bg-green-50",
                isError && "bg-red-50"
              )}
            >
              <div className="flex-shrink-0">
                {isCompleted && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {isError && (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                {isInProgress && (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                {isPending && (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isCompleted && "text-green-800",
                  isError && "text-red-800",
                  isInProgress && "text-blue-800",
                  isPending && "text-gray-600"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className={cn(
                    "text-xs mt-1",
                    isCompleted && "text-green-600",
                    isError && "text-red-600", 
                    isInProgress && "text-blue-600",
                    isPending && "text-gray-500"
                  )}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BatchProgressProps {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  className?: string;
}

export function BatchProgress({ total, completed, failed, inProgress, className }: BatchProgressProps) {
  const pending = total - completed - failed - inProgress;
  const completedPercentage = (completed / total) * 100;
  const failedPercentage = (failed / total) * 100;
  const inProgressPercentage = (inProgress / total) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progress</span>
        <span className="text-gray-600">
          {completed + failed} of {total} processed
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div className="h-full flex">
          {/* Completed */}
          <div 
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${completedPercentage}%` }}
          />
          {/* Failed */}
          <div 
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${failedPercentage}%` }}
          />
          {/* In Progress */}
          <div 
            className="bg-blue-500 animate-pulse transition-all duration-300"
            style={{ width: `${inProgressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Completed: {completed}</span>
          </div>
          {failed > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Failed: {failed}</span>
            </div>
          )}
          {inProgress > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Processing: {inProgress}</span>
            </div>
          )}
          {pending > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>Pending: {pending}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadProgressProps {
  files: Array<{
    name: string;
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
  }>;
  className?: string;
}

export function UploadProgress({ files, className }: UploadProgressProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {files.map((file, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium truncate flex-1 mr-2">{file.name}</span>
            <div className="flex items-center gap-2">
              {file.status === "completed" && (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              {file.status === "error" && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              {file.status === "uploading" && (
                <span className="text-gray-600">{Math.round(file.progress)}%</span>
              )}
            </div>
          </div>
          
          <Progress 
            value={file.progress} 
            className={cn(
              "h-2",
              file.status === "error" && "bg-red-100",
              file.status === "completed" && "bg-green-100"
            )}
          />
          
          {file.error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {file.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}