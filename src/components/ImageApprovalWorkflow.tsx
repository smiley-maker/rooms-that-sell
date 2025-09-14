"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Loader2,
  AlertCircle
} from "lucide-react";
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
import { toast } from "sonner";

interface ImageApprovalWorkflowProps {
  imageId: Id<"images">;
  currentStatus: string;
  onStatusChange?: () => void;
  compact?: boolean;
}

export function ImageApprovalWorkflow({ 
  imageId, 
  currentStatus, 
  onStatusChange,
  compact = false 
}: ImageApprovalWorkflowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const updateImageStatus = useMutation(api.images.updateImageStatus);

  const handleApprove = async () => {
    try {
      setIsUpdating(true);
      await updateImageStatus({
        imageId,
        status: "approved"
      });
      toast.success("Image approved successfully");
      onStatusChange?.();
    } catch (error) {
      console.error("Failed to approve image:", error);
      toast.error("Failed to approve image");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsUpdating(true);
      await updateImageStatus({
        imageId,
        status: "staged" // Reset to staged for re-review
      });
      toast.success("Image rejected - returned to staging");
      onStatusChange?.();
    } catch (error) {
      console.error("Failed to reject image:", error);
      toast.error("Failed to reject image");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsUpdating(true);
      // Reset to uploaded status to trigger re-staging
      await updateImageStatus({
        imageId,
        status: "uploaded"
      });
      toast.success("Image queued for regeneration");
      setShowRegenerateDialog(false);
      onStatusChange?.();
    } catch (error) {
      console.error("Failed to queue regeneration:", error);
      toast.error("Failed to queue regeneration");
    } finally {
      setIsUpdating(false);
    }
  };

  if (currentStatus === "approved") {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'flex-col' : ''}`}>
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Approved</span>
        </div>
        {!compact && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {!compact && <span className="ml-1">Unapprove</span>}
          </Button>
        )}
      </div>
    );
  }

  if (currentStatus === "exported") {
    return (
      <div className="flex items-center gap-1 text-purple-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Exported</span>
      </div>
    );
  }

  // For staged status
  return (
    <>
      <div className={`flex gap-2 ${compact ? 'flex-col' : ''}`}>
        <Button
          variant="default"
          size={compact ? "sm" : "sm"}
          onClick={handleApprove}
          disabled={isUpdating}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {!compact && <span className="ml-1">Approve</span>}
        </Button>
        
        <Button
          variant="outline"
          size={compact ? "sm" : "sm"}
          onClick={() => setShowRegenerateDialog(true)}
          disabled={isUpdating}
          className="flex-1"
        >
          <RotateCcw className="w-3 h-3" />
          {!compact && <span className="ml-1">Regenerate</span>}
        </Button>
      </div>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Regenerate Image
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will queue the image for re-staging with AI. The current staged version will be replaced. 
              This action will consume credits when the regeneration is processed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}