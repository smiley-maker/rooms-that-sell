"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Project } from "@/types/convex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  MapPin, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Archive
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { DashboardSkeleton } from "@/components/ui/skeleton";

interface ProjectDashboardProps {
  onCreateProject: () => void;
  onEditProject: (projectId: string) => void;
  onViewProject: (projectId: string) => void;
}

export function ProjectDashboard({ 
  onCreateProject, 
  onEditProject, 
  onViewProject 
}: ProjectDashboardProps) {
  const projects = useQuery(api.projects.getUserProjects);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const getListingTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-emerald-100 text-emerald-800";
      case "rent":
        return "bg-orange-100 text-orange-800";
      case "staging":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (projects === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your property listings and virtual staging projects
          </p>
        </div>
        <Button onClick={onCreateProject} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to start staging property photos
          </p>
          <Button onClick={onCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project: Project) => (
            <Card 
              key={project._id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onViewProject(project._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onViewProject(project._id);
                      }}>
                        View Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project._id);
                      }}>
                        Edit Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getListingTypeColor(project.listingType)}`}
                  >
                    {project.listingType.charAt(0).toUpperCase() + project.listingType.slice(1)}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(project.status)}`}
                  >
                    <span className="flex items-center gap-1">
                      {getStatusIcon(project.status)}
                      <span className="hidden sm:inline">
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <span className="text-xs sm:text-sm">{project.imageCount || 0}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      <span className="text-xs sm:text-sm">{project.stagedCount || 0}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="truncate">
                    Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {project.notes && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {project.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}