import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "./notifications";
import { AppErrorHandler, ErrorCode } from "./errors";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("success", () => {
    it("should show success notification", () => {
      NotificationService.success("Operation completed");

      expect(toast.success).toHaveBeenCalledWith("Operation completed", {
        description: undefined,
        duration: 4000,
        dismissible: true,
        action: undefined,
      });
    });

    it("should show success notification with options", () => {
      const action = { label: "View", onClick: vi.fn() };
      NotificationService.success("Upload complete", {
        description: "All files uploaded successfully",
        duration: 3000,
        action,
      });

      expect(toast.success).toHaveBeenCalledWith("Upload complete", {
        description: "All files uploaded successfully",
        duration: 3000,
        dismissible: true,
        action,
      });
    });
  });

  describe("error", () => {
    it("should show error notification with string", () => {
      NotificationService.error("Something went wrong");

      expect(toast.error).toHaveBeenCalledWith("Something went wrong", {
        description: undefined,
        duration: 6000,
        dismissible: true,
        action: undefined,
      });
    });

    it("should show error notification with AppError", () => {
      const appError = AppErrorHandler.createError(ErrorCode.IMAGE_UPLOAD_FAILED);
      NotificationService.error(appError);

      expect(toast.error).toHaveBeenCalledWith(appError.userMessage, {
        description: undefined,
        duration: 6000,
        dismissible: true,
        action: {
          label: "Retry",
          onClick: expect.any(Function),
        },
      });
    });

    it("should not add retry action for non-retryable errors", () => {
      const appError = AppErrorHandler.createError(ErrorCode.AUTH_REQUIRED);
      NotificationService.error(appError);

      expect(toast.error).toHaveBeenCalledWith(appError.userMessage, {
        description: undefined,
        duration: 6000,
        dismissible: true,
        action: undefined,
      });
    });
  });

  describe("handleError", () => {
    it("should show upgrade action for insufficient credits", () => {
      const appError = AppErrorHandler.createError(ErrorCode.INSUFFICIENT_CREDITS);
      
      // Mock window.location
      delete (window as any).location;
      window.location = { href: "" } as any;

      NotificationService.handleError(appError);

      expect(toast.error).toHaveBeenCalledWith(appError.userMessage, {
        action: {
          label: "Upgrade Plan",
          onClick: expect.any(Function),
        },
        description: undefined,
        dismissible: true,
        duration: 6000,
      });

      // Test the action
      const call = (toast.error as any).mock.calls[0];
      call[1].action.onClick();
      expect(window.location.href).toBe("/billing");
    });

    it("should show sign in action for auth required", () => {
      const appError = AppErrorHandler.createError(ErrorCode.AUTH_REQUIRED);
      
      // Mock window.location
      delete (window as any).location;
      window.location = { href: "" } as any;

      NotificationService.handleError(appError);

      expect(toast.error).toHaveBeenCalledWith(appError.userMessage, {
        action: {
          label: "Sign In",
          onClick: expect.any(Function),
        },
        description: undefined,
        dismissible: true,
        duration: 6000,
      });

      // Test the action
      const call = (toast.error as any).mock.calls[0];
      call[1].action.onClick();
      expect(window.location.href).toBe("/sign-in");
    });

    it("should show retry action for retryable errors", () => {
      const appError = AppErrorHandler.createError(ErrorCode.NETWORK_ERROR);
      const retryAction = vi.fn();

      NotificationService.handleError(appError, retryAction);

      expect(toast.error).toHaveBeenCalledWith(appError.userMessage, {
        action: {
          label: "Retry",
          onClick: retryAction,
        },
        description: undefined,
        dismissible: true,
        duration: 6000,
      });
    });
  });

  describe("batchOperation", () => {
    it("should show success for all completed", () => {
      NotificationService.batchOperation("Upload", 5, 5, 0);

      expect(toast.success).toHaveBeenCalledWith("Upload completed successfully", {
        action: undefined,
        description: "5 of 5 items processed",
        dismissible: true,
        duration: 4000,
      });
    });

    it("should show error for all failed", () => {
      NotificationService.batchOperation("Upload", 5, 0, 5);

      expect(toast.error).toHaveBeenCalledWith("Upload failed", {
        action: undefined,
        description: "5 of 5 items failed",
        dismissible: true,
        duration: 6000,
      });
    });

    it("should show warning for partial success", () => {
      NotificationService.batchOperation("Upload", 5, 3, 2);

      expect(toast.warning).toHaveBeenCalledWith("Upload completed with errors", {
        action: undefined,
        description: "3 succeeded, 2 failed out of 5 items",
        dismissible: true,
        duration: 5000,
      });
    });
  });

  describe("uploadProgress", () => {
    it("should show loading for in-progress upload", () => {
      NotificationService.uploadProgress("test.jpg", 50);

      expect(toast.loading).toHaveBeenCalledWith("Uploading test.jpg...", {
        id: "upload-test.jpg",
        description: "50% complete",
      });
    });

    it("should show success for completed upload", () => {
      NotificationService.uploadProgress("test.jpg", 100);

      expect(toast.dismiss).toHaveBeenCalledWith("upload-test.jpg");
      expect(toast.success).toHaveBeenCalledWith("test.jpg uploaded successfully", {
        action: undefined,
        description: undefined,
        dismissible: true,
        duration: 4000,
      });
    });
  });

  describe("stagingProgress", () => {
    it("should show loading for in-progress staging", () => {
      NotificationService.stagingProgress(5, 2);

      expect(toast.loading).toHaveBeenCalledWith("Staging images...", {
        id: "staging-progress",
        description: "2 of 5 images processed",
      });
    });

    it("should show success for completed staging", () => {
      NotificationService.stagingProgress(5, 5);

      expect(toast.dismiss).toHaveBeenCalledWith("staging-progress");
      expect(toast.success).toHaveBeenCalledWith("Staging completed", {
        action: undefined,
        description: "5 images staged successfully",
        dismissible: true,
        duration: 4000,
      });
    });
  });

  describe("creditNotification", () => {
    beforeEach(() => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: "" } as any;
    });

    it("should show error for zero credits on trial", () => {
      NotificationService.creditNotification(0, "trial");

      expect(toast.error).toHaveBeenCalledWith("You're out of credits!", {
        action: {
          label: "Upgrade Plan",
          onClick: expect.any(Function),
        },
        description: "Upgrade your plan to continue staging images.",
        dismissible: true,
        duration: 6000,
      });
    });

    it("should show error for zero credits on paid plan", () => {
      NotificationService.creditNotification(0, "agent");

      expect(toast.error).toHaveBeenCalledWith("You're out of credits!", {
        action: {
          label: "View Billing",
          onClick: expect.any(Function),
        },
        description: "Your monthly credits have been used up.",
        dismissible: true,
        duration: 6000,
      });
    });

    it("should show warning for low credits on trial", () => {
      NotificationService.creditNotification(3, "trial");

      expect(toast.warning).toHaveBeenCalledWith("Running low on credits", {
        action: {
          label: "Upgrade Plan",
          onClick: expect.any(Function),
        },
        description: "You have 3 credits remaining.",
        dismissible: true,
        duration: 5000,
      });
    });

    it("should show warning for low credits on paid plan", () => {
      NotificationService.creditNotification(2, "agent");

      expect(toast.warning).toHaveBeenCalledWith("Running low on credits", {
        action: undefined,
        description: "You have 2 credits remaining.",
        dismissible: true,
        duration: 5000,
      });
    });

    it("should not show notification for sufficient credits", () => {
      NotificationService.creditNotification(10, "agent");

      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });
  });
});