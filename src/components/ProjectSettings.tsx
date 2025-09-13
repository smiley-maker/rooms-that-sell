"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface ProjectSettingsProps {
  projectId: Id<"projects"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectDeleted?: () => void;
  onProjectUpdated?: () => void;
  embedded?: boolean;
}

export function ProjectSettings({ 
  projectId, 
  open, 
  onOpenChange, 
  onProjectDeleted,
  onProjectUpdated,
  embedded = false
}: ProjectSettingsProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    listingType: "",
    status: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const project = useQuery(
    api.projects.getProject,
    projectId ? { projectId } : "skip"
  );
  const updateProject = useMutation(api.projects.updateProject);
  const deleteProject = useMutation(api.projects.deleteProject);

  // Update form data when project loads
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        address: project.address,
        listingType: project.listingType,
        status: project.status,
        notes: project.notes || "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId || !formData.name.trim() || !formData.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateProject({
        projectId,
        name: formData.name.trim(),
        address: formData.address.trim(),
        listingType: formData.listingType,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      });

      toast.success("Project updated successfully!");
      onOpenChange(false);
      onProjectUpdated?.();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectId) return;

    setIsSubmitting(true);
    
    try {
      await deleteProject({ projectId });
      toast.success("Project deleted successfully!");
      setShowDeleteDialog(false);
      onOpenChange(false);
      onProjectDeleted?.();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!project && projectId) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., 123 Main Street Listing"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Property Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street, City, State 12345"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listingType">Listing Type</Label>
                <Select
                  value={formData.listingType}
                  onValueChange={(value) => handleInputChange("listingType", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                    <SelectItem value="staging">Staging Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this project..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

      <div className="flex-col sm:flex-row gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Project
        </Button>
        
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 sm:ml-auto">
          {!embedded && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );

  if (embedded) {
    return (
      <>
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Project Settings</h2>
            <p className="text-muted-foreground">
              Update project details and manage settings
            </p>
          </div>
          {formContent}
        </div>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project? This action will permanently 
                remove the project and all associated images. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Update project details and manage settings
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action will permanently 
              remove the project and all associated images. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}