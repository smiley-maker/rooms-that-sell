"use client";

import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Download, 
  FileImage, 
  Archive, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Package
} from 'lucide-react';

interface BatchDownloaderProps {
  projectId: Id<"projects">;
  images: Array<{
    _id: Id<"images">;
    filename: string;
    originalUrl: string;
    stagedUrl?: string;
    status: string;
  }>;
  selectedImages: Id<"images">[];
  onDownloadComplete?: () => void;
}

interface DownloadOptions {
  includeOriginal: boolean;
  includeStaged: boolean;
  resolutions: string[];
  format: 'individual' | 'zip';
  namingConvention: 'original' | 'structured';
}

interface DownloadProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  files: Array<{
    filename: string;
    url: string;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
  }>;
}

export function BatchDownloader({ 
  projectId, 
  images, 
  selectedImages, 
  onDownloadComplete 
}: BatchDownloaderProps) {
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    includeOriginal: true,
    includeStaged: true,
    resolutions: ['MLS Standard'],
    format: 'zip',
    namingConvention: 'structured'
  });
  
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    total: 0,
    completed: 0,
    current: '',
    status: 'idle',
    files: []
  });

  // Actions
  const getImageDownloadUrl = useAction(api.images.getImageDownloadUrl);

  const selectedImageData = images.filter(img => selectedImages.includes(img._id));
  const stagedImages = selectedImageData.filter(img => img.stagedUrl);

  const resolutionOptions = [
    { name: 'MLS Standard', width: 1024, height: 768 },
    { name: 'MLS Large', width: 1200, height: 800 },
    { name: 'High Resolution', width: 1920, height: 1080 },
    { name: 'Ultra High', width: 2560, height: 1440 },
  ];

  const generateStructuredFilename = (
    originalFilename: string, 
    type: 'original' | 'staged', 
    resolution: string
  ): string => {
    const baseName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    const resolutionSuffix = resolution.toLowerCase().replace(/\s+/g, '_');
    const typeSuffix = type === 'staged' ? '_staged' : '_original';
    
    return `${baseName}${typeSuffix}_${resolutionSuffix}.jpg`;
  };

  const calculateTotalFiles = (): number => {
    let total = 0;
    const resolutionCount = downloadOptions.resolutions.length;
    
    if (downloadOptions.includeOriginal) {
      total += selectedImages.length * resolutionCount;
    }
    
    if (downloadOptions.includeStaged) {
      total += stagedImages.length * resolutionCount;
    }
    
    return total;
  };

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      alert('Please select images to download');
      return;
    }

    const totalFiles = calculateTotalFiles();
    
    setDownloadProgress({
      total: totalFiles,
      completed: 0,
      current: 'Preparing download...',
      status: 'processing',
      files: []
    });

    try {
      const filesToDownload: Array<{
        filename: string;
        url: string;
        status: 'pending' | 'downloading' | 'completed' | 'failed';
      }> = [];

      // Generate download URLs for each selected image and resolution
      for (const image of selectedImageData) {
        for (const resolution of downloadOptions.resolutions) {
          // Original image
          if (downloadOptions.includeOriginal) {
            try {
              const originalUrl = await getImageDownloadUrl({
                imageId: image._id,
                isStaged: false
              });
              
              const filename = downloadOptions.namingConvention === 'structured'
                ? generateStructuredFilename(image.filename, 'original', resolution)
                : `original_${resolution.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`;
              
              filesToDownload.push({
                filename,
                url: originalUrl,
                status: 'pending'
              });
            } catch (error) {
              console.error(`Failed to get original URL for ${image.filename}:`, error);
            }
          }

          // Staged image
          if (downloadOptions.includeStaged && image.stagedUrl) {
            try {
              const stagedUrl = await getImageDownloadUrl({
                imageId: image._id,
                isStaged: true
              });
              
              const filename = downloadOptions.namingConvention === 'structured'
                ? generateStructuredFilename(image.filename, 'staged', resolution)
                : `staged_${resolution.toLowerCase().replace(/\s+/g, '_')}_${image.filename}`;
              
              filesToDownload.push({
                filename,
                url: stagedUrl,
                status: 'pending'
              });
            } catch (error) {
              console.error(`Failed to get staged URL for ${image.filename}:`, error);
            }
          }
        }
      }

      setDownloadProgress(prev => ({
        ...prev,
        files: filesToDownload,
        current: `Prepared ${filesToDownload.length} files for download`
      }));

      if (downloadOptions.format === 'zip') {
        await downloadAsZip(filesToDownload);
      } else {
        await downloadIndividualFiles(filesToDownload);
      }

      setDownloadProgress(prev => ({
        ...prev,
        completed: prev.total,
        current: 'Download completed!',
        status: 'completed'
      }));

      if (onDownloadComplete) {
        onDownloadComplete();
      }

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({
        ...prev,
        current: 'Download failed',
        status: 'failed'
      }));
    }
  };

  const downloadAsZip = async (files: Array<{ filename: string; url: string; status: string }>) => {
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let completed = 0;

      for (const file of files) {
        setDownloadProgress(prev => ({
          ...prev,
          current: `Adding ${file.filename} to archive...`,
          completed,
          files: prev.files.map(f => 
            f.filename === file.filename 
              ? { ...f, status: 'downloading' as const }
              : f
          )
        }));

        try {
          if (file.url.startsWith('data:')) {
            // Handle data URLs
            const base64Data = file.url.split(',')[1];
            zip.file(file.filename, base64Data, { base64: true });
          } else {
            // Handle regular URLs
            const response = await fetch(file.url);
            if (!response.ok) throw new Error(`Failed to fetch ${file.filename}`);
            const blob = await response.blob();
            zip.file(file.filename, blob);
          }

          completed++;
          setDownloadProgress(prev => ({
            ...prev,
            completed,
            files: prev.files.map(f => 
              f.filename === file.filename 
                ? { ...f, status: 'completed' as const }
                : f
            )
          }));

        } catch (error) {
          console.error(`Failed to add ${file.filename} to zip:`, error);
          setDownloadProgress(prev => ({
            ...prev,
            files: prev.files.map(f => 
              f.filename === file.filename 
                ? { ...f, status: 'failed' as const }
                : f
            )
          }));
        }
      }

      setDownloadProgress(prev => ({
        ...prev,
        current: 'Creating ZIP archive...'
      }));

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_download_${projectId}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to create ZIP file:', error);
      throw new Error('Failed to create ZIP archive');
    }
  };

  const downloadIndividualFiles = async (files: Array<{ filename: string; url: string; status: string }>) => {
    let completed = 0;

    for (const file of files) {
      setDownloadProgress(prev => ({
        ...prev,
        current: `Downloading ${file.filename}...`,
        completed,
        files: prev.files.map(f => 
          f.filename === file.filename 
            ? { ...f, status: 'downloading' as const }
            : f
        )
      }));

      try {
        if (file.url.startsWith('data:')) {
          // Handle data URLs
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Handle regular URLs
          const response = await fetch(file.url);
          if (!response.ok) throw new Error(`Failed to fetch ${file.filename}`);
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
        }

        completed++;
        setDownloadProgress(prev => ({
          ...prev,
          completed,
          files: prev.files.map(f => 
            f.filename === file.filename 
              ? { ...f, status: 'completed' as const }
              : f
          )
        }));

        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Failed to download ${file.filename}:`, error);
        setDownloadProgress(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.filename === file.filename 
              ? { ...f, status: 'failed' as const }
              : f
          )
        }));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Batch Download
        </CardTitle>
        <CardDescription>
          Download multiple images with custom settings and organized file naming
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Progress */}
        {downloadProgress.status !== 'idle' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{downloadProgress.current}</span>
                <span>{downloadProgress.completed}/{downloadProgress.total}</span>
              </div>
              <Progress 
                value={(downloadProgress.completed / downloadProgress.total) * 100} 
                className="w-full"
              />
            </div>
            
            {downloadProgress.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Download completed successfully! Check your downloads folder.
                </AlertDescription>
              </Alert>
            )}
            
            {downloadProgress.status === 'failed' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Download failed. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Download Options */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Include Types</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-original"
                  checked={downloadOptions.includeOriginal}
                  onCheckedChange={(checked) => 
                    setDownloadOptions(prev => ({ ...prev, includeOriginal: checked === true }))
                  }
                />
                <Label htmlFor="include-original">
                  Original Images ({selectedImages.length} files)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-staged"
                  checked={downloadOptions.includeStaged}
                  onCheckedChange={(checked) => 
                    setDownloadOptions(prev => ({ ...prev, includeStaged: checked === true }))
                  }
                />
                <Label htmlFor="include-staged">
                  Staged Images ({stagedImages.length} files)
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Resolutions</Label>
            <div className="grid grid-cols-2 gap-2">
              {resolutionOptions.map((resolution) => (
                <div key={resolution.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={`resolution-${resolution.name}`}
                    checked={downloadOptions.resolutions.includes(resolution.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setDownloadOptions(prev => ({
                          ...prev,
                          resolutions: [...prev.resolutions, resolution.name]
                        }));
                      } else {
                        setDownloadOptions(prev => ({
                          ...prev,
                          resolutions: prev.resolutions.filter(r => r !== resolution.name)
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={`resolution-${resolution.name}`} className="text-sm">
                    {resolution.name} ({resolution.width}×{resolution.height})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Download Format</Label>
              <Select
                value={downloadOptions.format}
                onValueChange={(value: 'individual' | 'zip') => 
                  setDownloadOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">ZIP Archive</SelectItem>
                  <SelectItem value="individual">Individual Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File Naming</Label>
              <Select
                value={downloadOptions.namingConvention}
                onValueChange={(value: 'original' | 'structured') => 
                  setDownloadOptions(prev => ({ ...prev, namingConvention: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="structured">Structured Names</SelectItem>
                  <SelectItem value="original">Original Names</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Download Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Selected Images:</span>
              <span className="font-medium">{selectedImages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolutions:</span>
              <span className="font-medium">{downloadOptions.resolutions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Files:</span>
              <span className="font-medium">{calculateTotalFiles()}</span>
            </div>
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="font-medium capitalize">{downloadOptions.format}</span>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={
            downloadProgress.status === 'processing' || 
            selectedImages.length === 0 || 
            downloadOptions.resolutions.length === 0 ||
            (!downloadOptions.includeOriginal && !downloadOptions.includeStaged)
          }
          className="w-full"
        >
          {downloadProgress.status === 'processing' ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              {downloadOptions.format === 'zip' ? (
                <Archive className="w-4 h-4 mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download {calculateTotalFiles()} Files
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}