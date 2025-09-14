"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectDashboard, ProjectCreator, ProjectSettings } from "@/components";
import { Id } from "../../../convex/_generated/dataModel";

export default function ProjectsPage() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);

  const handleCreateProject = () => {
    setShowCreateDialog(true);
  };

  const handleEditProject = (projectId: string) => {
    setSelectedProjectId(projectId as Id<"projects">);
    setShowSettingsDialog(true);
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleProjectCreated = (projectId: string) => {
    console.log("Project created:", projectId);
    // Optionally navigate to the new project
    // router.push(`/projects/${projectId}`);
  };

  const handleProjectUpdated = () => {
    console.log("Project updated");
    // The query will automatically refetch due to Convex reactivity
  };

  const handleProjectDeleted = () => {
    console.log("Project deleted");
    // The query will automatically refetch due to Convex reactivity
  };

  return (
    <>
      <ProjectDashboard
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
        onViewProject={handleViewProject}
      />

      <ProjectCreator
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
      />

      <ProjectSettings
        projectId={selectedProjectId}
        open={showSettingsDialog}
        onOpenChange={(open) => {
          setShowSettingsDialog(open);
          if (!open) {
            setSelectedProjectId(null);
          }
        }}
        onProjectDeleted={handleProjectDeleted}
        onProjectUpdated={handleProjectUpdated}
      />
    </>
  );
}