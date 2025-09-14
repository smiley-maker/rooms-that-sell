/**
 * Error handling utilities and types for RoomsThatSell application
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  context?: Record<string, any>;
}

export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_FAILED = "AUTH_FAILED",
  
  // User/Account errors
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS",
  
  // Project errors
  PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
  PROJECT_CREATE_FAILED = "PROJECT_CREATE_FAILED",
  PROJECT_UPDATE_FAILED = "PROJECT_UPDATE_FAILED",
  PROJECT_DELETE_FAILED = "PROJECT_DELETE_FAILED",
  
  // Image errors
  IMAGE_UPLOAD_FAILED = "IMAGE_UPLOAD_FAILED",
  IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE",
  IMAGE_INVALID_FORMAT = "IMAGE_INVALID_FORMAT",
  IMAGE_NOT_FOUND = "IMAGE_NOT_FOUND",
  IMAGE_PROCESSING_FAILED = "IMAGE_PROCESSING_FAILED",
  
  // AI/Staging errors
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  AI_PROCESSING_TIMEOUT = "AI_PROCESSING_TIMEOUT",
  AI_RATE_LIMIT = "AI_RATE_LIMIT",
  STAGING_JOB_FAILED = "STAGING_JOB_FAILED",
  
  // Storage errors
  STORAGE_UPLOAD_FAILED = "STORAGE_UPLOAD_FAILED",
  STORAGE_DOWNLOAD_FAILED = "STORAGE_DOWNLOAD_FAILED",
  
  // Payment/Billing errors
  PAYMENT_FAILED = "PAYMENT_FAILED",
  SUBSCRIPTION_NOT_FOUND = "SUBSCRIPTION_NOT_FOUND",
  BILLING_ERROR = "BILLING_ERROR",
  
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  
  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Generic errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
}

export class AppErrorHandler {
  private static errorMessages: Record<ErrorCode, { message: string; userMessage: string; retryable: boolean }> = {
    [ErrorCode.AUTH_REQUIRED]: {
      message: "Authentication required",
      userMessage: "Please sign in to continue",
      retryable: false,
    },
    [ErrorCode.AUTH_FAILED]: {
      message: "Authentication failed",
      userMessage: "Sign in failed. Please try again.",
      retryable: true,
    },
    [ErrorCode.USER_NOT_FOUND]: {
      message: "User not found",
      userMessage: "User account not found. Please sign in again.",
      retryable: false,
    },
    [ErrorCode.INSUFFICIENT_CREDITS]: {
      message: "Insufficient credits",
      userMessage: "You don't have enough credits. Please upgrade your plan.",
      retryable: false,
    },
    [ErrorCode.PROJECT_NOT_FOUND]: {
      message: "Project not found",
      userMessage: "Project not found. It may have been deleted.",
      retryable: false,
    },
    [ErrorCode.PROJECT_CREATE_FAILED]: {
      message: "Failed to create project",
      userMessage: "Failed to create project. Please try again.",
      retryable: true,
    },
    [ErrorCode.PROJECT_UPDATE_FAILED]: {
      message: "Failed to update project",
      userMessage: "Failed to update project. Please try again.",
      retryable: true,
    },
    [ErrorCode.PROJECT_DELETE_FAILED]: {
      message: "Failed to delete project",
      userMessage: "Failed to delete project. Please try again.",
      retryable: true,
    },
    [ErrorCode.IMAGE_UPLOAD_FAILED]: {
      message: "Image upload failed",
      userMessage: "Failed to upload image. Please check your connection and try again.",
      retryable: true,
    },
    [ErrorCode.IMAGE_TOO_LARGE]: {
      message: "Image file too large",
      userMessage: "Image is too large. Please use an image smaller than 10MB.",
      retryable: false,
    },
    [ErrorCode.IMAGE_INVALID_FORMAT]: {
      message: "Invalid image format",
      userMessage: "Invalid image format. Please use JPEG, PNG, or WebP.",
      retryable: false,
    },
    [ErrorCode.IMAGE_NOT_FOUND]: {
      message: "Image not found",
      userMessage: "Image not found. It may have been deleted.",
      retryable: false,
    },
    [ErrorCode.IMAGE_PROCESSING_FAILED]: {
      message: "Image processing failed",
      userMessage: "Failed to process image. Please try again.",
      retryable: true,
    },
    [ErrorCode.AI_SERVICE_UNAVAILABLE]: {
      message: "AI service unavailable",
      userMessage: "AI staging service is temporarily unavailable. Please try again later.",
      retryable: true,
    },
    [ErrorCode.AI_PROCESSING_TIMEOUT]: {
      message: "AI processing timeout",
      userMessage: "Image processing is taking longer than expected. Please try again.",
      retryable: true,
    },
    [ErrorCode.AI_RATE_LIMIT]: {
      message: "AI service rate limit exceeded",
      userMessage: "Too many requests. Please wait a moment and try again.",
      retryable: true,
    },
    [ErrorCode.STAGING_JOB_FAILED]: {
      message: "Staging job failed",
      userMessage: "Failed to stage image. Please try again.",
      retryable: true,
    },
    [ErrorCode.STORAGE_UPLOAD_FAILED]: {
      message: "Storage upload failed",
      userMessage: "Failed to save image. Please check your connection and try again.",
      retryable: true,
    },
    [ErrorCode.STORAGE_DOWNLOAD_FAILED]: {
      message: "Storage download failed",
      userMessage: "Failed to download image. Please try again.",
      retryable: true,
    },
    [ErrorCode.PAYMENT_FAILED]: {
      message: "Payment failed",
      userMessage: "Payment failed. Please check your payment method and try again.",
      retryable: true,
    },
    [ErrorCode.SUBSCRIPTION_NOT_FOUND]: {
      message: "Subscription not found",
      userMessage: "Subscription not found. Please contact support.",
      retryable: false,
    },
    [ErrorCode.BILLING_ERROR]: {
      message: "Billing error",
      userMessage: "Billing error occurred. Please try again or contact support.",
      retryable: true,
    },
    [ErrorCode.NETWORK_ERROR]: {
      message: "Network error",
      userMessage: "Network error. Please check your connection and try again.",
      retryable: true,
    },
    [ErrorCode.TIMEOUT_ERROR]: {
      message: "Request timeout",
      userMessage: "Request timed out. Please try again.",
      retryable: true,
    },
    [ErrorCode.VALIDATION_ERROR]: {
      message: "Validation error",
      userMessage: "Please check your input and try again.",
      retryable: false,
    },
    [ErrorCode.MISSING_REQUIRED_FIELD]: {
      message: "Missing required field",
      userMessage: "Please fill in all required fields.",
      retryable: false,
    },
    [ErrorCode.UNKNOWN_ERROR]: {
      message: "Unknown error",
      userMessage: "An unexpected error occurred. Please try again.",
      retryable: true,
    },
    [ErrorCode.SERVER_ERROR]: {
      message: "Server error",
      userMessage: "Server error occurred. Please try again later.",
      retryable: true,
    },
  };

  static createError(
    code: ErrorCode,
    originalError?: Error | unknown,
    context?: Record<string, any>
  ): AppError {
    const errorConfig = this.errorMessages[code] || this.errorMessages[ErrorCode.UNKNOWN_ERROR];
    
    return {
      code,
      message: errorConfig.message,
      userMessage: errorConfig.userMessage,
      retryable: errorConfig.retryable,
      context: {
        ...context,
        originalError: originalError instanceof Error ? originalError.message : String(originalError),
        timestamp: new Date().toISOString(),
      },
    };
  }

  static fromConvexError(error: any): AppError {
    const errorMessage = error?.message || String(error);
    
    // Map common Convex errors to our error codes
    if (errorMessage.includes("Unauthenticated")) {
      return this.createError(ErrorCode.AUTH_REQUIRED, error);
    }
    
    if (errorMessage.includes("User not found")) {
      return this.createError(ErrorCode.USER_NOT_FOUND, error);
    }
    
    if (errorMessage.includes("Insufficient credits")) {
      return this.createError(ErrorCode.INSUFFICIENT_CREDITS, error);
    }
    
    if (errorMessage.includes("Project not found")) {
      return this.createError(ErrorCode.PROJECT_NOT_FOUND, error);
    }
    
    if (errorMessage.includes("Image not found")) {
      return this.createError(ErrorCode.IMAGE_NOT_FOUND, error);
    }
    
    // Default to server error for unhandled Convex errors
    return this.createError(ErrorCode.SERVER_ERROR, error);
  }

  static fromNetworkError(error: any): AppError {
    if (error?.name === "TimeoutError" || error?.message?.includes("timeout")) {
      return this.createError(ErrorCode.TIMEOUT_ERROR, error);
    }
    
    if (error?.name === "NetworkError" || !navigator.onLine) {
      return this.createError(ErrorCode.NETWORK_ERROR, error);
    }
    
    return this.createError(ErrorCode.UNKNOWN_ERROR, error);
  }

  static logError(error: AppError): void {
    console.error(`[${error.code}] ${error.message}`, {
      userMessage: error.userMessage,
      retryable: error.retryable,
      context: error.context,
    });
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or similar
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error);
    }
  }
}

/**
 * Utility function to handle async operations with proper error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext?: Record<string, any>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    let appError: AppError;
    
    if (error && typeof error === "object" && "code" in error) {
      // Already an AppError
      appError = error as AppError;
    } else {
      // Convert to AppError
      appError = AppErrorHandler.fromConvexError(error);
      if (errorContext) {
        appError.context = { ...appError.context, ...errorContext };
      }
    }
    
    AppErrorHandler.logError(appError);
    return { error: appError };
  }
}