"use client";

import React, { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';

interface ComplianceValidatorProps {
  imageId: Id<"images">;
  image: {
    _id: Id<"images">;
    filename: string;
    originalUrl: string;
    stagedUrl?: string;
    mlsCompliance?: {
      isCompliant: boolean;
      score: number;
      violations: string[];
      warnings: string[];
      lastChecked: number;
      structuralPreservation: {
        validated: boolean;
        confidence: number;
        issues: string[];
      };
      watermarkApplied: boolean;
    };
  };
  onValidationComplete?: () => void;
}

export function ComplianceValidator({ 
  imageId, 
  image, 
  onValidationComplete 
}: ComplianceValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [isApplyingWatermark, setIsApplyingWatermark] = useState(false);

  // Actions and Mutations
  const validateCompliance = useAction(api.mlsCompliance.validateImageCompliance);
  const applyWatermark = useAction(api.mlsCompliance.applyImageWatermark);

  const handleValidation = async () => {
    console.log('handleValidation called for image:', imageId);
    if (!image.stagedUrl) {
      console.log('No staged URL available');
      return;
    }
    
    setIsValidating(true);
    try {
      console.log('Calling validateCompliance with imageId:', imageId);
      const result = await validateCompliance({ imageId });
      console.log('Validation result:', result);
      
      // Show success message
      alert('Validation completed successfully!');
      onValidationComplete?.();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyWatermark = async () => {
    if (!image.stagedUrl) return;
    
    setIsApplyingWatermark(true);
    try {
      await applyWatermark({ 
        imageId,
        watermarkOptions: {
          text: "Virtually Staged",
          position: "bottom-right",
          opacity: 0.8,
          fontSize: 24,
          color: "#FFFFFF",
        }
      });
      onValidationComplete?.();
    } catch (error) {
      console.error('Watermark application failed:', error);
    } finally {
      setIsApplyingWatermark(false);
    }
  };

  const compliance = image.mlsCompliance;
  const hasStaged = !!image.stagedUrl;
  const needsValidation = hasStaged && (!compliance || 
    (Date.now() - compliance.lastChecked) > 24 * 60 * 60 * 1000);

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getComplianceBadge = () => {
    if (!hasStaged) {
      return (
        <Badge variant="secondary">
          <Eye className="w-3 h-3 mr-1" />
          Not Staged
        </Badge>
      );
    }

    if (!compliance) {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending Validation
        </Badge>
      );
    }

    if (compliance.isCompliant) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          MLS Compliant
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Compliance Issues
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{image.filename}</CardTitle>
            <CardDescription>MLS Compliance Status</CardDescription>
          </div>
          {getComplianceBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Compliance Score */}
        {compliance && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Compliance Score</span>
              <span className={`text-sm font-bold ${getComplianceColor(compliance.score)}`}>
                {compliance.score}/100
              </span>
            </div>
            <Progress value={compliance.score} className="h-2" />
          </div>
        )}

        {/* Structural Preservation */}
        {compliance?.structuralPreservation && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Structural Preservation</span>
              <span className="text-sm">
                {(compliance.structuralPreservation.confidence * 100).toFixed(1)}% confidence
              </span>
            </div>
            {compliance.structuralPreservation.issues.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Structural issues detected: {compliance.structuralPreservation.issues.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Watermark Status */}
        {hasStaged && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Watermark Applied</span>
            <div className="flex items-center gap-2">
              {compliance?.watermarkApplied ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Applied
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="w-3 h-3 mr-1" />
                  Missing
                </Badge>
              )}
              {!compliance?.watermarkApplied && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyWatermark}
                  disabled={isApplyingWatermark}
                >
                  {isApplyingWatermark ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Violations */}
        {compliance?.violations && compliance.violations.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-red-600">Violations</span>
            <ul className="space-y-1">
              {compliance.violations.map((violation, idx) => (
                <li key={idx} className="text-xs text-red-600 flex items-start gap-2">
                  <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {violation}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {compliance?.warnings && compliance.warnings.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-yellow-600">Warnings</span>
            <ul className="space-y-1">
              {compliance.warnings.map((warning, idx) => (
                <li key={idx} className="text-xs text-yellow-600 flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Checked */}
        {compliance && (
          <div className="text-xs text-muted-foreground">
            Last checked: {new Date(compliance.lastChecked).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {hasStaged && (
            <Button
              size="sm"
              onClick={handleValidation}
              disabled={isValidating}
              variant={needsValidation ? "default" : "outline"}
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  {needsValidation ? 'Validate' : 'Re-validate'}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}