"use client";

import { Id } from "../../convex/_generated/dataModel";

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

export function ComplianceValidator(props: ComplianceValidatorProps) {
  void props;
  return null;
}
