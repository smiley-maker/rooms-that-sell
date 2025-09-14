import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppErrorHandler, ErrorCode, withErrorHandling } from "./errors";

describe("AppErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createError", () => {
    it("should create an error with correct properties", () => {
      const error = AppErrorHandler.createError(
        ErrorCode.IMAGE_UPLOAD_FAILED,
        new Error("Original error"),
        { filename: "test.jpg" }
      );

      expect(error.code).toBe(ErrorCode.IMAGE_UPLOAD_FAILED);
      expect(error.message).toBe("Image upload failed");
      expect(error.userMessage).toBe("Failed to upload image. Please check your connection and try again.");
      expect(error.retryable).toBe(true);
      expect(error.context).toMatchObject({
        filename: "test.jpg",
        originalError: "Original error",
      });
      expect(error.context?.timestamp).toBeDefined();
    });

    it("should handle unknown error codes", () => {
      const error = AppErrorHandler.createError(
        "UNKNOWN_CODE" as ErrorCode,
        new Error("Test error")
      );

      expect(error.code).toBe("UNKNOWN_CODE");
      expect(error.message).toBe("Unknown error");
      expect(error.userMessage).toBe("An unexpected error occurred. Please try again.");
      expect(error.retryable).toBe(true);
    });
  });

  describe("fromConvexError", () => {
    it("should map Unauthenticated errors", () => {
      const convexError = { message: "Unauthenticated request" };
      const error = AppErrorHandler.fromConvexError(convexError);

      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(error.retryable).toBe(false);
    });

    it("should map User not found errors", () => {
      const convexError = { message: "User not found" };
      const error = AppErrorHandler.fromConvexError(convexError);

      expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
      expect(error.retryable).toBe(false);
    });

    it("should map Insufficient credits errors", () => {
      const convexError = { message: "Insufficient credits" };
      const error = AppErrorHandler.fromConvexError(convexError);

      expect(error.code).toBe(ErrorCode.INSUFFICIENT_CREDITS);
      expect(error.retryable).toBe(false);
    });

    it("should default to server error for unknown Convex errors", () => {
      const convexError = { message: "Some unknown error" };
      const error = AppErrorHandler.fromConvexError(convexError);

      expect(error.code).toBe(ErrorCode.SERVER_ERROR);
      expect(error.retryable).toBe(true);
    });
  });

  describe("fromNetworkError", () => {
    it("should map timeout errors", () => {
      const networkError = { name: "TimeoutError", message: "Request timeout" };
      const error = AppErrorHandler.fromNetworkError(networkError);

      expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
      expect(error.retryable).toBe(true);
    });

    it("should map network errors", () => {
      const networkError = { name: "NetworkError", message: "Network failure" };
      const error = AppErrorHandler.fromNetworkError(networkError);

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.retryable).toBe(true);
    });

    it("should handle offline scenarios", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });

      const networkError = { message: "Fetch failed" };
      const error = AppErrorHandler.fromNetworkError(networkError);

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.retryable).toBe(true);

      // Restore navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
    });
  });

  describe("logError", () => {
    it("should log error details", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      const error = AppErrorHandler.createError(
        ErrorCode.IMAGE_UPLOAD_FAILED,
        new Error("Test error"),
        { filename: "test.jpg" }
      );

      AppErrorHandler.logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        `[${ErrorCode.IMAGE_UPLOAD_FAILED}] Image upload failed`,
        expect.objectContaining({
          userMessage: error.userMessage,
          retryable: error.retryable,
          context: error.context,
        })
      );

      consoleSpy.mockRestore();
    });
  });
});

describe("withErrorHandling", () => {
  it("should return data on successful operation", async () => {
    const operation = vi.fn().mockResolvedValue("success");
    const result = await withErrorHandling(operation);

    expect(result.data).toBe("success");
    expect(result.error).toBeUndefined();
    expect(operation).toHaveBeenCalledOnce();
  });

  it("should return error on failed operation", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Test error"));
    const result = await withErrorHandling(operation, { test: "context" });

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe(ErrorCode.SERVER_ERROR);
    expect(result.error?.context).toMatchObject({ test: "context" });
  });

  it("should handle AppError instances", async () => {
    const appError = AppErrorHandler.createError(ErrorCode.AUTH_REQUIRED);
    const operation = vi.fn().mockRejectedValue(appError);
    const result = await withErrorHandling(operation);

    expect(result.data).toBeUndefined();
    expect(result.error).toBe(appError);
  });
});