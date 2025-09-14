"use client";

import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Image, MLSExport } from '@/types/convex';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Download, 
  FileImage, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface ExportManagerProps {
  projectId: Id<"projects">;
  selectedImages: Id<"images">[];
  onExportComplete?: (exportId: Id<"mlsExports">) => void;
}

interface ExportProgress {
  total: number;
  completed: number;
  current?: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
}

export function ExportManager({ 
  projectId, 
  selectedImages, 
  onExportComplete 
}: ExportManagerProps) {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    total: 0,
    completed: 0,
    status: 'idle'
  });

  // Queries
  const projectImages = useQuery(api.images.getProjectImages, { projectId });
  const exportResolutions = useQuery(api.mlsCompliance.getExportResolutions);
  const recentExports = useQuery(api.mlsCompliance.getProjectMLSExports, { projectId });

  // Actions
  const createExport = useAction(api.mlsCompliance.createMLSExport);

  const selectedImageData = projectImages?.filter((img: Image) => selectedImages.includes(img._id)) || [];
  const stagedImages = selectedImageData.filter((img: Image) => img.stagedUrl);
  const approvedImages = selectedImageData.filter((img: Image) => img.status === 'approved');

  const handleQuickExport = async (exportType: 'mls-standard' | 'high-res' | 'all-formats') => {
    if (selectedImages.length === 0) {
      alert('Please select images to export');
      return;
    }

    setExportProgress({
      total: selectedImages.length,
      completed: 0,
      current: 'Preparing export...',
      status: 'processing'
    });

    try {
      let resolutions: string[] = [];
      
      switch (exportType) {
        case 'mls-standard':
          resolutions = ['MLS Standard', 'MLS Large'];
          break;
        case 'high-res':
          resolutions = ['High Resolution', 'Ultra High'];
          break;
        case 'all-formats':
          resolutions = ['MLS Standard', 'MLS Large', 'High Resolution', 'Ultra High'];
          break;
      }

      const result = await createExport({
        projectId,
        imageIds: selectedImages,
        exportOptions: {
          includeOriginal: true,
          includeStaged: stagedImages.length > 0,
          resolutions,
          watermarkOptions: {
            text: 'Virtually Staged',
            position: 'bottom-right',
            opacity: 0.8,
            fontSize: 24,
            color: '#FFFFFF',
          },
        },
      });

      setExportProgress({
        total: selectedImages.length,
        completed: selectedImages.length,
        current: 'Export completed!',
        status: 'completed'
      });

      if (onExportComplete && 'exportId' in result && result.exportId) {
        onExportComplete(result.exportId as Id<"mlsExports">);
      }

    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress({
        total: selectedImages.length,
        completed: 0,
        current: 'Export failed',
        status: 'failed'
      });
    }
  };

  const getExportStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Export Status */}
      {exportProgress.status !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Export Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{exportProgress.current}</span>
                <span>{exportProgress.completed}/{exportProgress.total}</span>
              </div>
              <Progress 
                value={(exportProgress.completed / exportProgress.total) * 100} 
                className="w-full"
              />
            </div>
            
            {exportProgress.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Export completed successfully! Check the download center below for your files.
                </AlertDescription>
              </Alert>
            )}
            
            {exportProgress.status === 'failed' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Export failed. Please try again or contact support if the issue persists.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-4 h-4" />
            Quick Export
          </CardTitle>
          <CardDescription>
            Export {selectedImages.length} selected image(s) with predefined settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => handleQuickExport('mls-standard')}
              disabled={exportProgress.status === 'processing' || selectedImages.length === 0}
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                <span className="font-medium">MLS Standard</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                1024×768 and 1200×800 resolutions
                <br />
                Perfect for MLS listings
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedImages.length * 2} files
              </Badge>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => handleQuickExport('high-res')}
              disabled={exportProgress.status === 'processing' || selectedImages.length === 0}
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                <span className="font-medium">High Resolution</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                1920×1080 and 2560×1440 resolutions
                <br />
                For marketing materials
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedImages.length * 2} files
              </Badge>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => handleQuickExport('all-formats')}
              disabled={exportProgress.status === 'processing' || selectedImages.length === 0}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">All Formats</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                All available resolutions
                <br />
                Complete export package
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedImages.length * 4} files
              </Badge>
            </Button>
          </div>

          {selectedImages.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select images from the gallery to enable export options.
              </AlertDescription>
            </Alert>
          )}

          {stagedImages.length === 0 && selectedImages.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No staged images selected. Only original images will be exported.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Export Summary */}
      {selectedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">Selected Images</div>
                <div className="font-medium">{selectedImages.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Staged Images</div>
                <div className="font-medium">{stagedImages.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Approved Images</div>
                <div className="font-medium">{approvedImages.length}</div>
              </div>
              <div className="space-y-1">
                <div className="text-muted-foreground">Available Resolutions</div>
                <div className="font-medium">{exportResolutions?.length || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Exports */}
      {recentExports && recentExports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Exports</CardTitle>
            <CardDescription>
              Your export history for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExports.slice(0, 5).map((exportRecord: MLSExport) => (
                <div key={exportRecord._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getExportStatusIcon(exportRecord.status)}
                    <div>
                      <div className="font-medium text-sm">
                        {exportRecord.imageIds.length} images • {exportRecord.resolutions.join(', ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(exportRecord.createdAt).toLocaleDateString()} at{' '}
                        {new Date(exportRecord.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exportRecord.status === 'completed' ? 'default' : 'secondary'}>
                      {exportRecord.status}
                    </Badge>
                    {exportRecord.status === 'completed' && (
                      <Badge variant="outline">
                        {exportRecord.exportUrls.length} files
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}