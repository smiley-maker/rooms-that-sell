"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ProjectImageManager, MLSComplianceDashboard } from "@/components";
import { Image } from "@/types/convex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Archive,
  Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(api.projects.getProject, { projectId });
  const images = useQuery(api.images.getProjectImages, { projectId });

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
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  if (project === undefined || images === undefined) {
    return <DashboardSkeleton />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Project Not Found</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const stagedImages = images?.filter((img: Image) => img.status === "staged" || img.status === "approved") || [];
  const uploadedImages = images?.filter((img: Image) => img.status === "uploaded") || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back to Projects</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl truncate">{project.name}</CardTitle>
              <div className="flex items-center text-sm sm:text-base text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{project.address}</span>
              </div>
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
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/settings`)}
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.notes && (
            <div>
              <h4 className="font-medium mb-2 text-sm sm:text-base">Notes</h4>
              <p className="text-sm text-muted-foreground">{project.notes}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                <strong>{images.length}</strong> total images
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm">
                <strong>{uploadedImages.length}</strong> ready to stage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm">
                <strong>{stagedImages.length}</strong> staged
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </div>
            {project.updatedAt !== project.createdAt && (
              <span className="sm:ml-4">
                • Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2 text-xs sm:text-sm">
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Images & Staging</span>
            <span className="sm:hidden">Images</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2 text-xs sm:text-sm">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">MLS Compliance</span>
            <span className="sm:hidden">Compliance</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-4 sm:mt-6">
          <ProjectImageManager projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-4 sm:mt-6">
          <MLSComplianceDashboard projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}