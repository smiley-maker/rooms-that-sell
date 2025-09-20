import { Id } from "../../convex/_generated/dataModel";

// Image types
export interface ImageMetadata {
  detectedFeatures?: string[];
  confidence?: number;
  processingTime?: number;
  stylePreset?: string;
  aiModel?: string;
}

export interface MLSCompliance {
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
}

export interface Image {
  _id: Id<"images">;
  _creationTime: number;
  projectId: Id<"projects">;
  userId: Id<"users">;
  originalUrl: string;
  stagedUrl?: string;
  imageKey?: string;
  stagedKey?: string;
  currentVersionId?: Id<"imageVersions">;
  roomType: string;
  filename: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  status: string;
  metadata: ImageMetadata;
  mlsCompliance?: MLSCompliance;
  createdAt: number;
  updatedAt: number;
}

export interface ImageVersion {
  _id: Id<"imageVersions">;
  _creationTime: number;
  imageId: Id<"images">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  stagedUrl: string;
  stagedKey: string;
  stylePreset: string;
  customPrompt?: string;
  seed: number;
  aiModel: string;
  processingTime: number;
  pinned: boolean;
  mlsCompliance?: MLSCompliance;
  createdAt: number;
}

export interface ProjectVideo {
  _id: Id<"projectVideos">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  imageId: Id<"images">;
  versionId: Id<"imageVersions"> | null;
  videoKey: string | null;
  videoUrl: string | null;
  status: string;
  message: string | null;
  createdAt: number;
  updatedAt: number;
}


// Project types
export interface Project {
  _id: Id<"projects">;
  _creationTime: number;
  userId: Id<"users">;
  name: string;
  address: string;
  listingType: string;
  status: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  imageCount?: number;
  stagedCount?: number;
}

// User types
export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkId: string;
  email: string;
  plan: string;
  credits: number;
  stripeCustomerId?: string;
  createdAt: number;
  lastActiveAt: number;
}

// Staging job types
export interface StagingJobResult {
  imageId: Id<"images">;
  stagedUrl: string;
  success: boolean;
  error?: string;
}

export interface StagingJob {
  _id: Id<"stagingJobs">;
  _creationTime: number;
  userId: Id<"users">;
  imageIds: Id<"images">[];
  stylePreset: string;
  customPrompt?: string;
  status: string;
  results?: StagingJobResult[];
  creditsUsed: number;
  createdAt: number;
  completedAt?: number;
}

// Subscription types
export interface Subscription {
  _id: Id<"subscriptions">;
  _creationTime: number;
  userId: Id<"users">;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

// Credit transaction types
export interface CreditTransaction {
  _id: Id<"creditTransactions">;
  _creationTime: number;
  userId: Id<"users">;
  type: string;
  amount: number;
  description: string;
  relatedJobId?: Id<"stagingJobs">;
  createdAt: number;
}

// MLS Export types
export interface MLSExportUrl {
  type: string;
  resolution: string;
  url: string;
  filename: string;
}

export interface MLSExport {
  _id: Id<"mlsExports">;
  _creationTime: number;
  userId: Id<"users">;
  projectId: Id<"projects">;
  imageIds: Id<"images">[];
  exportType: string;
  resolutions: string[];
  watermarkSettings: {
    text: string;
    position: string;
    opacity: number;
    fontSize: number;
    color: string;
  };
  complianceValidated: boolean;
  exportUrls: MLSExportUrl[];
  status: string;
  createdAt: number;
  completedAt?: number;
}

// Export resolution types
export interface ExportResolution {
  name: string;
  width: number;
  height: number;
}

// MLS Guidelines types
export interface MLSGuidelines {
  requirements: string[];
  bestPractices: string[];
  commonViolations: string[];
}
