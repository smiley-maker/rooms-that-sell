"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { ProjectSettings } from "@/components";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(api.projects.getProject, { projectId });

  const handleProjectUpdated = () => {
    console.log("Project updated");
    // Navigate back to project detail page
    router.push(`/projects/${projectId}`);
  };

  const handleProjectDeleted = () => {
    console.log("Project deleted");
    // Navigate back to projects list
    router.push("/projects");
  };

  if (project === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button onClick={() => router.push("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>
        <h1 className="text-2xl font-bold">Project Settings</h1>
      </div>

      {/* Settings Component */}
      <ProjectSettings
        projectId={projectId}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            router.push(`/projects/${projectId}`);
          }
        }}
        onProjectDeleted={handleProjectDeleted}
        onProjectUpdated={handleProjectUpdated}
        embedded={true}
      />
    </div>
  );
}