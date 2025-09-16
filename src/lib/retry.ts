/**
 * Retry mechanisms for failed operations
 */


// Helper function to safely extract error message
function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error);
}

// Helper function to safely extract error name
function getErrorName(error: unknown): string | undefined {
  if (error && typeof error === "object" && "name" in error) {
    return String(error.name);
  }
  return undefined;
}

// Helper function to safely extract error status
function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;
    if (typeof status === "number") {
      return status;
    }
  }
  return undefined;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  exponentialBackoff: true,
  retryCondition: (error) => {
    // Default: retry on network errors, timeouts, and server errors
    const errorName = getErrorName(error);
    const errorMessage = getErrorMessage(error);
    const errorStatus = getErrorStatus(error);
    
    if (errorName === "NetworkError" || errorName === "TimeoutError") {
      return true;
    }
    
    if (errorMessage.includes("timeout") || errorMessage.includes("network")) {
      return true;
    }
    
    // Retry on 5xx server errors
    if (errorStatus && errorStatus >= 500 && errorStatus < 600) {
      return true;
    }
    
    // Don't retry on client errors (4xx) or authentication errors
    return false;
  },
};

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if this is the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Check if we should retry this error
      if (!config.retryCondition!(error)) {
        break;
      }
      
      // Call onRetry callback if provided
      config.onRetry?.(attempt, error);
      
      // Calculate delay with exponential backoff
      let delay = config.baseDelay;
      if (config.exponentialBackoff) {
        delay = Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
      }
      
      // Add some jitter to prevent thundering herd
      delay += Math.random() * 1000;
      
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry specifically for Convex operations
 */
export async function withConvexRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return withRetry(operation, {
    ...options,
    retryCondition: (error) => {
      // Retry on network errors and server errors
      const errorName = getErrorName(error);
      if (errorName === "NetworkError" || errorName === "TimeoutError") {
        return true;
      }
      
      // Retry on Convex server errors but not client errors
      const message = getErrorMessage(error);
      if (message.includes("Internal server error") || message.includes("Service unavailable")) {
        return true;
      }
      
      // Don't retry on authentication or validation errors
      if (message.includes("Unauthenticated") || message.includes("Invalid")) {
        return false;
      }
      
      return options.retryCondition?.(error) ?? false;
    },
  });
}

/**
 * Retry specifically for image upload operations
 */
export async function withUploadRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    ...options,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and server errors
      const errorName = getErrorName(error);
      if (errorName === "NetworkError" || errorName === "TimeoutError") {
        return true;
      }
      
      // Retry on upload-specific errors
      const message = getErrorMessage(error);
      if (message.includes("upload") || message.includes("network") || message.includes("timeout")) {
        return true;
      }
      
      // Don't retry on file size or format errors
      if (message.includes("too large") || message.includes("invalid format")) {
        return false;
      }
      
      return options.retryCondition?.(error) ?? true;
    },
  });
}

/**
 * Retry specifically for AI processing operations
 */
export async function withAIRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 2, // AI operations are expensive, limit retries
    baseDelay: 5000, // Longer delay for AI operations
    maxDelay: 30000,
    ...options,
    retryCondition: (error) => {
      const message = getErrorMessage(error);
      
      // Retry on rate limits (with longer delay)
      if (message.includes("rate limit") || message.includes("quota")) {
        return true;
      }
      
      // Retry on temporary AI service errors
      if (message.toLowerCase().includes("service unavailable") || message.toLowerCase().includes("timeout")) {
        return true;
      }
      
      // Don't retry on invalid input or authentication errors
      if (message.includes("invalid") || message.includes("unauthorized")) {
        return false;
      }
      
      return options.retryCondition?.(error) ?? false;
    },
  });
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Hook for using retry functionality in React components
 */
export function useRetry() {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const executeWithRetry = React.useCallback(async <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);

    try {
      return await withRetry(operation, {
        ...options,
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          options?.onRetry?.(attempt, error);
        },
      });
    } finally {
      setIsRetrying(false);
      setRetryCount(0);
    }
  }, []);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
  };
}

// Import React for the hook
import React from "react";