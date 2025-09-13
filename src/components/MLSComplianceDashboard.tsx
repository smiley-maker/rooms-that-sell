"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Download,
  Shield,
  FileText,
  Eye
} from 'lucide-react';

interface MLSComplianceDashboardProps {
  projectId: Id<"projects">;
}

export function MLSComplianceDashboard({ projectId }: MLSComplianceDashboardProps) {
  const [selectedImages, setSelectedImages] = useState<Id<"images">[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const complianceStatus = useQuery(api.mlsCompliance.getProjectComplianceStatus, { projectId });
  const projectImages = useQuery(api.images.getProjectImages, { projectId });
  const mlsExports = useQuery(api.mlsCompliance.getProjectMLSExports, { projectId });
  const guidelines = useQuery(api.mlsCompliance.getComplianceGuidelines);
  const exportResolutions = useQuery(api.mlsCompliance.getExportResolutions);

  // Actions and Mutations
  // Actions and Mutations
  const batchValidate = useAction(api.mlsCompliance.batchValidateCompliance);
  const createExport = useAction(api.mlsCompliance.createMLSExport);
  
  // Debug: Check if functions are available
  React.useEffect(() => {
    console.log('MLSComplianceDashboard mounted');
    console.log('api object:', api);
    console.log('api.mlsCompliance:', api.mlsCompliance);
    
    if (api.mlsCompliance) {
      console.log('Available mlsCompliance functions:', Object.keys(api.mlsCompliance));
    }
  }, []);

  const handleBatchValidation = async () => {
    console.log('handleBatchValidation called');
    if (!projectImages) {
      console.log('No project images available');
      return;
    }
    
    setIsValidating(true);
    try {
      const stagedImages = projectImages
        .filter(img => img.stagedUrl && img.status === 'staged')
        .map(img => img._id);
      
      console.log('Staged images to validate:', stagedImages);
      
      if (stagedImages.length === 0) {
        console.log('No staged images to validate');
        return;
      }
      
      console.log('Calling batchValidate with:', { imageIds: stagedImages });
      const result = await batchValidate({ imageIds: stagedImages });
      console.log('Batch validation result:', result);
      
      // Show success message
      alert(`Validation completed! Processed ${stagedImages.length} images.`);
    } catch (error) {
      console.error('Batch validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleMLSExport = async () => {
    console.log('handleMLSExport called');
    console.log('exportResolutions:', exportResolutions);
    console.log('selectedImages:', selectedImages);
    
    if (!exportResolutions || selectedImages.length === 0) {
      console.log('Missing export resolutions or no images selected');
      return;
    }
    
    setIsExporting(true);
    try {
      const exportOptions = {
        includeOriginal: true,
        includeStaged: true,
        resolutions: exportResolutions?.map((r: any) => r.name) || [],
        watermarkOptions: {
          text: "Virtually Staged",
          position: "bottom-right",
          opacity: 0.8,
          fontSize: 24,
          color: "#FFFFFF",
        },
      };
      
      console.log('Calling createExport with:', {
        projectId,
        imageIds: selectedImages,
        exportOptions,
      });
      
      const result = await createExport({
        projectId,
        imageIds: selectedImages,
        exportOptions,
      });
      
      console.log('Export result:', result);
      
      // Show success message
      alert(`Export completed! Generated ${result.totalFiles || 0} files for ${selectedImages.length} images.`);
      setSelectedImages([]);
    } catch (error) {
      console.error('MLS export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleImageSelection = (imageId: Id<"images">) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  if (!complianceStatus || !projectImages) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const complianceRate = complianceStatus.complianceRate;
  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceStatus.totalImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staged Images</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceStatus.stagedImages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceStatus.compliantImages}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(complianceRate)}`}>
              {complianceRate.toFixed(1)}%
            </div>
            <Progress value={complianceRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Compliance Issues Alert */}
      {complianceStatus.complianceIssues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {complianceStatus.complianceIssues.length} image(s) have compliance issues that need attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="images" className="w-full">
        <TabsList>
          <TabsTrigger value="images">Images & Compliance</TabsTrigger>
          <TabsTrigger value="exports">MLS Exports</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Image Compliance Status</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log('Validate All button clicked');
                  handleBatchValidation();
                }}
                disabled={isValidating || complianceStatus.stagedImages === 0}
                variant="outline"
              >
                {isValidating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Validate All
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  console.log('Export Selected button clicked');
                  handleMLSExport();
                }}
                disabled={isExporting || selectedImages.length === 0}
              >
                {isExporting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected ({selectedImages.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectImages.map((image) => {
              const isSelected = selectedImages.includes(image._id);
              const compliance = image.mlsCompliance;
              
              return (
                <Card 
                  key={image._id} 
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => image.stagedUrl && toggleImageSelection(image._id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm truncate">{image.filename}</CardTitle>
                      {image.stagedUrl && (
                        <div className="flex gap-1">
                          {compliance ? (
                            compliance.isCompliant ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Compliant
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="w-3 h-3 mr-1" />
                                Issues
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {image.roomType.replace('_', ' ')} • {image.status}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {image.stagedUrl && (
                      <div className="space-y-2">
                        {compliance && (
                          <>
                            <div className="text-xs">
                              <span className="font-medium">Score:</span> {compliance.score}/100
                            </div>
                            {compliance.violations.length > 0 && (
                              <div className="text-xs text-red-600">
                                <span className="font-medium">Violations:</span>
                                <ul className="list-disc list-inside mt-1">
                                  {compliance.violations.slice(0, 2).map((violation, idx) => (
                                    <li key={idx} className="truncate">{violation}</li>
                                  ))}
                                  {compliance.violations.length > 2 && (
                                    <li>+{compliance.violations.length - 2} more...</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {compliance.warnings.length > 0 && (
                              <div className="text-xs text-yellow-600">
                                <span className="font-medium">Warnings:</span> {compliance.warnings.length}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {!image.stagedUrl && (
                      <div className="text-xs text-muted-foreground">
                        Not staged yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Export History</h3>
          </div>

          {mlsExports && mlsExports.length > 0 ? (
            <div className="space-y-4">
              {mlsExports.map((exportRecord) => (
                <Card key={exportRecord._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">
                          Export {exportRecord.exportType} • {exportRecord.imageIds.length} images
                        </CardTitle>
                        <CardDescription>
                          {new Date(exportRecord.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          exportRecord.status === 'completed' ? 'default' :
                          exportRecord.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {exportRecord.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Resolutions:</span> {exportRecord.resolutions.join(', ')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Compliance Validated:</span>{' '}
                        {exportRecord.complianceValidated ? (
                          <span className="text-green-600">Yes</span>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </div>
                      {exportRecord.exportUrls.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Files:</span> {exportRecord.exportUrls.length} generated
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No exports yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select images and create your first MLS export
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          {guidelines && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>MLS Requirements</CardTitle>
                  <CardDescription>
                    Critical requirements that must be met for MLS compliance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guidelines.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best Practices</CardTitle>
                  <CardDescription>
                    Recommended practices for high-quality virtual staging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guidelines.bestPractices.map((practice, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Violations</CardTitle>
                  <CardDescription>
                    Issues to avoid that can cause MLS compliance problems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guidelines.commonViolations.map((violation, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{violation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}