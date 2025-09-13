"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  FileImage,
  Palette
} from 'lucide-react';

interface MLSExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  selectedImages: Id<"images">[];
}

interface WatermarkSettings {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
}

export function MLSExportDialog({ 
  isOpen, 
  onClose, 
  projectId, 
  selectedImages 
}: MLSExportDialogProps) {
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [includeStaged, setIncludeStaged] = useState(true);
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(['MLS Standard', 'MLS Large']);
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    text: 'Virtually Staged',
    position: 'bottom-right',
    opacity: 0.8,
    fontSize: 24,
    color: '#FFFFFF',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const projectImages = useQuery(api.images.getProjectImages, { projectId });
  const exportResolutions = useQuery(api.mlsCompliance.getExportResolutions);
  const complianceStatus = useQuery(api.mlsCompliance.getProjectComplianceStatus, { projectId });

  // Actions
  // Actions
  const createExport = useAction(api.mlsCompliance.createMLSExport);

  const selectedImageData = projectImages?.filter(img => selectedImages.includes(img._id)) || [];
  const stagedImages = selectedImageData.filter(img => img.stagedUrl);
  const nonCompliantImages = selectedImageData.filter(img => 
    img.mlsCompliance && !img.mlsCompliance.isCompliant
  );

  const handleResolutionToggle = (resolution: string) => {
    setSelectedResolutions(prev => 
      prev.includes(resolution)
        ? prev.filter(r => r !== resolution)
        : [...prev, resolution]
    );
  };

  const handleExport = async () => {
    if (selectedResolutions.length === 0) {
      alert('Please select at least one resolution');
      return;
    }

    if (!includeOriginal && !includeStaged) {
      alert('Please select at least one export type (original or staged)');
      return;
    }

    setIsExporting(true);
    try {
      const result = await createExport({
        projectId,
        imageIds: selectedImages,
        exportOptions: {
          includeOriginal,
          includeStaged,
          resolutions: selectedResolutions,
          watermarkOptions: watermarkSettings,
        },
      });

      // Handle successful export
      console.log('Export created:', result);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const estimatedFileCount = selectedImages.length * selectedResolutions.length * 
    ((includeOriginal ? 1 : 0) + (includeStaged ? 1 : 0));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            MLS Export Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your MLS-compliant export package for {selectedImages.length} selected image(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Compliance Warning */}
          {nonCompliantImages.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {nonCompliantImages.length} selected image(s) have compliance issues. 
                Consider validating compliance before exporting.
              </AlertDescription>
            </Alert>
          )}

          {/* Export Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                Export Types
              </CardTitle>
              <CardDescription>
                Choose which versions to include in your export package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-original"
                  checked={includeOriginal}
                  onCheckedChange={(checked) => setIncludeOriginal(checked === true)}
                />
                <Label htmlFor="include-original" className="flex items-center gap-2">
                  Original Images
                  <Badge variant="outline">{selectedImages.length} files</Badge>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-staged"
                  checked={includeStaged}
                  onCheckedChange={(checked) => setIncludeStaged(checked === true)}
                />
                <Label htmlFor="include-staged" className="flex items-center gap-2">
                  Staged Images
                  <Badge variant="outline">{stagedImages.length} files</Badge>
                  {stagedImages.length < selectedImages.length && (
                    <Badge variant="secondary">
                      {selectedImages.length - stagedImages.length} not staged
                    </Badge>
                  )}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Resolutions</CardTitle>
              <CardDescription>
                Select the resolutions for your MLS export package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {exportResolutions?.map((resolution) => (
                  <div key={resolution.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`resolution-${resolution.name}`}
                      checked={selectedResolutions.includes(resolution.name)}
                      onCheckedChange={() => handleResolutionToggle(resolution.name)}
                    />
                    <Label 
                      htmlFor={`resolution-${resolution.name}`}
                      className="text-sm cursor-pointer"
                    >
                      <div>
                        <div className="font-medium">{resolution.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {resolution.width} × {resolution.height}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Watermark Settings */}
          {includeStaged && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Watermark Settings
                </CardTitle>
                <CardDescription>
                  Configure the "Virtually Staged" watermark for MLS compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkSettings.text}
                      onChange={(e) => setWatermarkSettings(prev => ({
                        ...prev,
                        text: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="watermark-position">Position</Label>
                    <Select
                      value={watermarkSettings.position}
                      onValueChange={(value: any) => setWatermarkSettings(prev => ({
                        ...prev,
                        position: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="watermark-opacity">Opacity</Label>
                    <Input
                      id="watermark-opacity"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={watermarkSettings.opacity}
                      onChange={(e) => setWatermarkSettings(prev => ({
                        ...prev,
                        opacity: parseFloat(e.target.value)
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="watermark-size">Font Size</Label>
                    <Input
                      id="watermark-size"
                      type="number"
                      min="12"
                      max="48"
                      value={watermarkSettings.fontSize}
                      onChange={(e) => setWatermarkSettings(prev => ({
                        ...prev,
                        fontSize: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="watermark-color">Color</Label>
                    <Input
                      id="watermark-color"
                      type="color"
                      value={watermarkSettings.color}
                      onChange={(e) => setWatermarkSettings(prev => ({
                        ...prev,
                        color: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Selected Images:</span>
                  <span className="font-medium">{selectedImages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Resolutions:</span>
                  <span className="font-medium">{selectedResolutions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Types:</span>
                  <span className="font-medium">
                    {[includeOriginal && 'Original', includeStaged && 'Staged']
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Files:</span>
                  <span>{estimatedFileCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedResolutions.length === 0}
          >
            {isExporting ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Creating Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Create Export Package
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}