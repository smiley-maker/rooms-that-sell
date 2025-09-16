/**
 * Enhanced notification system with better error handling and user feedback
 */

import { toast } from "sonner";
import { AppError, ErrorCode } from "./errors";

export interface NotificationOptions {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  dismissible?: boolean;
}

export class NotificationService {
  /**
   * Show success notification
   */
  static success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }

  /**
   * Show error notification with enhanced error handling
   */
  static error(error: string | AppError, options?: NotificationOptions) {
    let message: string;
    let description: string | undefined;
    let action: NotificationOptions["action"] | undefined;

    if (typeof error === "string") {
      message = error;
      description = options?.description;
      action = options?.action;
    } else {
      message = error.userMessage;
      description = options?.description;
      
      // Use the action from options if provided, otherwise add retry action for retryable errors
      if (options?.action) {
        action = options.action;
      } else if (error.retryable) {
        action = {
          label: "Retry",
          onClick: () => {
            // This will be overridden by the calling component
            console.log("Retry action triggered");
          },
        };
      }
    }

    return toast.error(message, {
      description,
      duration: options?.duration || 6000,
      dismissible: options?.dismissible ?? true,
      action,
    });
  }

  /**
   * Show warning notification
   */
  static warning(message: string, options?: NotificationOptions) {
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }

  /**
   * Show info notification
   */
  static info(message: string, options?: NotificationOptions) {
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      dismissible: options?.dismissible ?? true,
      action: options?.action,
    });
  }

  /**
   * Show loading notification
   */
  static loading(message: string, options?: Omit<NotificationOptions, "action">) {
    return toast.loading(message, {
      description: options?.description,
      dismissible: options?.dismissible ?? false,
    });
  }

  /**
   * Show progress notification for long-running operations
   */
  static progress(message: string, progress: number, options?: Omit<NotificationOptions, "action">) {
    const progressBar = `${"█".repeat(Math.floor(progress / 5))}${"░".repeat(20 - Math.floor(progress / 5))} ${Math.round(progress)}%`;
    
    return toast.loading(`${message}\n${progressBar}`, {
      description: options?.description,
      dismissible: options?.dismissible ?? false,
    });
  }

  /**
   * Dismiss a specific notification
   */
  static dismiss(toastId: string | number) {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all notifications
   */
  static dismissAll() {
    toast.dismiss();
  }

  /**
   * Show notification for specific error codes with appropriate actions
   */
  static handleError(error: AppError, retryAction?: () => void) {
    let action: NotificationOptions["action"] | undefined;

    // Add specific actions based on error code
    switch (error.code) {
      case ErrorCode.INSUFFICIENT_CREDITS:
        action = {
          label: "Upgrade Plan",
          onClick: () => {
            window.location.href = "/billing";
          },
        };
        break;
      
      case ErrorCode.AUTH_REQUIRED:
        action = {
          label: "Sign In",
          onClick: () => {
            window.location.href = "/sign-in";
          },
        };
        break;
      
      default:
        if (error.retryable && retryAction) {
          action = {
            label: "Retry",
            onClick: retryAction,
          };
        }
        break;
    }

    return this.error(error, { action });
  }

  /**
   * Show batch operation notifications
   */
  static batchOperation(
    operation: string,
    total: number,
    completed: number,
    failed: number
  ) {
    if (failed === 0) {
      return this.success(`${operation} completed successfully`, {
        description: `${completed} of ${total} items processed`,
      });
    } else if (completed === 0) {
      return this.error(`${operation} failed`, {
        description: `${failed} of ${total} items failed`,
      });
    } else {
      return this.warning(`${operation} completed with errors`, {
        description: `${completed} succeeded, ${failed} failed out of ${total} items`,
      });
    }
  }

  /**
   * Show upload notifications
   */
  static uploadProgress(filename: string, progress: number) {
    const toastId = `upload-${filename}`;
    
    if (progress < 100) {
      return toast.loading(`Uploading ${filename}...`, {
        id: toastId,
        description: `${Math.round(progress)}% complete`,
      });
    } else {
      toast.dismiss(toastId);
      return this.success(`${filename} uploaded successfully`);
    }
  }

  /**
   * Show staging operation notifications
   */
  static stagingProgress(imageCount: number, completed: number) {
    const toastId = "staging-progress";
    
    if (completed < imageCount) {
      return toast.loading("Staging images...", {
        id: toastId,
        description: `${completed} of ${imageCount} images processed`,
      });
    } else {
      toast.dismiss(toastId);
      return this.success("Staging completed", {
        description: `${imageCount} images staged successfully`,
      });
    }
  }

  /**
   * Show credit-related notifications
   */
  static creditNotification(credits: number, plan: string) {
    if (credits === 0) {
      return this.error("You're out of credits!", {
        description: plan === "trial" 
          ? "Upgrade your plan to continue staging images."
          : "Your monthly credits have been used up.",
        action: {
          label: plan === "trial" ? "Upgrade Plan" : "View Billing",
          onClick: () => {
            window.location.href = "/billing";
          },
        },
      });
    } else if (credits <= 5) {
      return this.warning("Running low on credits", {
        description: `You have ${credits} credits remaining.`,
        action: plan === "trial" ? {
          label: "Upgrade Plan",
          onClick: () => {
            window.location.href = "/billing";
          },
        } : undefined,
      });
    }
  }
}

/**
 * Hook for using notifications in React components
 */
export function useNotifications() {
  return {
    success: NotificationService.success,
    error: NotificationService.error,
    warning: NotificationService.warning,
    info: NotificationService.info,
    loading: NotificationService.loading,
    progress: NotificationService.progress,
    dismiss: NotificationService.dismiss,
    dismissAll: NotificationService.dismissAll,
    handleError: NotificationService.handleError,
    batchOperation: NotificationService.batchOperation,
    uploadProgress: NotificationService.uploadProgress,
    stagingProgress: NotificationService.stagingProgress,
    creditNotification: NotificationService.creditNotification,
  };
}