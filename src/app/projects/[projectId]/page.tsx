"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ProjectImageManager, MLSComplianceDashboard } from "@/components";
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
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const stagedImages = images.filter(img => img.status === "staged" || img.status === "approved");
  const uploadedImages = images.filter(img => img.status === "uploaded");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                {project.address}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={getListingTypeColor(project.listingType)}
                >
                  {project.listingType.charAt(0).toUpperCase() + project.listingType.slice(1)}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={getStatusColor(project.status)}
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
              onClick={() => router.push(`/projects/${projectId}/settings`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-muted-foreground">{project.notes}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{images.length}</strong> total images
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                <strong>{uploadedImages.length}</strong> ready to stage
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                <strong>{stagedImages.length}</strong> staged
              </span>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            {project.updatedAt !== project.createdAt && (
              <span className="ml-4">
                • Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Images & Staging
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            MLS Compliance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="mt-6">
          <ProjectImageManager projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-6">
          <MLSComplianceDashboard projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}