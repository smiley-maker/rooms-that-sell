"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { MLSExport } from '@/types/convex';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Download, 
  FileImage, 
  Package, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Archive,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface DownloadCenterProps {
  projectId: Id<"projects">;
}

interface DownloadProgress {
  [key: string]: {
    progress: number;
    status: 'downloading' | 'completed' | 'failed';
  };
}

export function DownloadCenter({ projectId }: DownloadCenterProps) {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({});
  const [selectedExport, setSelectedExport] = useState<Id<"mlsExports"> | null>(null);

  // Queries
  const exports = useQuery(api.mlsCompliance.getProjectMLSExports, { projectId });
  // Actions

  const handleDownloadFile = async (exportRecord: { _id: string }, fileUrl: string, filename: string) => {
    const downloadId = `${exportRecord._id}-${filename}`;
    
    setDownloadProgress(prev => ({
      ...prev,
      [downloadId]: { progress: 0, status: 'downloading' }
    }));

    try {
      // For data URLs, create blob and download directly
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloadProgress(prev => ({
          ...prev,
          [downloadId]: { progress: 100, status: 'completed' }
        }));
        return;
      }

      // For regular URLs, fetch and download
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      setDownloadProgress(prev => ({
        ...prev,
        [downloadId]: { progress: 100, status: 'completed' }
      }));

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({
        ...prev,
        [downloadId]: { progress: 0, status: 'failed' }
      }));
    }
  };

  const handleBatchDownload = async (exportRecord: { _id: string; exportUrls: Array<{ url: string; filename: string }> }) => {
    if (!exportRecord.exportUrls || exportRecord.exportUrls.length === 0) {
      alert('No files available for download');
      return;
    }

    // Download all files in the export
    for (const file of exportRecord.exportUrls) {
      await handleDownloadFile(exportRecord, file.url, file.filename);
      // Add small delay between downloads to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleDownloadAsZip = async (exportRecord: { _id: string; exportUrls: Array<{ url: string; filename: string }> }) => {
    if (!exportRecord.exportUrls || exportRecord.exportUrls.length === 0) {
      alert('No files available for download');
      return;
    }

    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each file to the zip
      for (const file of exportRecord.exportUrls) {
        try {
          if (file.url.startsWith('data:')) {
            // Handle data URLs
            const base64Data = file.url.split(',')[1];
            zip.file(file.filename, base64Data, { base64: true });
          } else {
            // Handle regular URLs
            const response = await fetch(file.url);
            const blob = await response.blob();
            zip.file(file.filename, blob);
          }
        } catch (error) {
          console.error(`Failed to add ${file.filename} to zip:`, error);
        }
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${exportRecord._id}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to create zip file:', error);
      alert('Failed to create zip file. Please try downloading files individually.');
    }
  };

  const getStatusIcon = (status: string) => {
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


  const getDownloadStatus = (exportId: string, filename: string) => {
    const downloadId = `${exportId}-${filename}`;
    return downloadProgress[downloadId];
  };

  if (!exports || exports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Center
          </CardTitle>
          <CardDescription>
            No exports available for this project yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Create your first export using the Export Manager to see download options here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Center
          </CardTitle>
          <CardDescription>
            Download your exported images and manage export history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recent Exports</TabsTrigger>
              <TabsTrigger value="history">Export History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-4">
              {exports.slice(0, 3).map((exportRecord: MLSExport) => (
                <Card key={exportRecord._id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(exportRecord.status)}
                        <div>
                          <CardTitle className="text-base">
                            Export from {new Date(exportRecord.createdAt).toLocaleDateString()}
                          </CardTitle>
                          <CardDescription>
                            {exportRecord.imageIds.length} images • {exportRecord.resolutions.join(', ')}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={exportRecord.status === 'completed' ? 'default' : 'secondary'}>
                        {exportRecord.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {exportRecord.status === 'completed' && exportRecord.exportUrls.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {exportRecord.exportUrls.length} files ready for download
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBatchDownload(exportRecord)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download All
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadAsZip(exportRecord)}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Download ZIP
                            </Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {exportRecord.exportUrls.map((file: { url: string; filename: string; type?: string; resolution?: string }, index: number) => {
                            const downloadStatus = getDownloadStatus(exportRecord._id, file.filename);
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border rounded text-sm"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileImage className="w-4 h-4 flex-shrink-0" />
                                  <div className="truncate">
                                    <div className="font-medium truncate">{file.filename}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {file.type || 'Unknown'} • {file.resolution || 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadFile(exportRecord, file.url, file.filename)}
                                  disabled={downloadStatus?.status === 'downloading'}
                                >
                                  {downloadStatus?.status === 'downloading' ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : downloadStatus?.status === 'completed' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  )}
                  
                  {exportRecord.status === 'processing' && (
                    <CardContent className="pt-0">
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Export is being processed. This may take a few minutes depending on the number of images and resolutions.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                  
                  {exportRecord.status === 'failed' && (
                    <CardContent className="pt-0">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Export failed. Please try creating a new export or contact support if the issue persists.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                {exports.map((exportRecord: MLSExport) => (
                  <div
                    key={exportRecord._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(exportRecord.status)}
                      <div>
                        <div className="font-medium text-sm">
                          {new Date(exportRecord.createdAt).toLocaleDateString()} at{' '}
                          {new Date(exportRecord.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {exportRecord.imageIds.length} images • {exportRecord.exportType} • {exportRecord.resolutions.join(', ')}
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
                      
                      {exportRecord.status === 'completed' && exportRecord.exportUrls.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedExport(
                            selectedExport === exportRecord._id ? null : exportRecord._id
                          )}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}