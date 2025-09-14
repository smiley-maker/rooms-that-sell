/**
 * Hook for handling async operations with comprehensive error handling,
 * loading states, and retry functionality
 */

import { useState, useCallback } from "react";
import { AppError, AppErrorHandler, withErrorHandling } from "@/lib/errors";
import { withRetry, RetryOptions } from "@/lib/retry";
import { useNotifications } from "@/lib/notifications";

export interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  retryCount: number;
}

export interface AsyncOperationOptions {
  retryOptions?: Partial<RetryOptions>;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
}

export function useAsyncOperation<T = any>(
  options: AsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const notifications = useNotifications();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    operationOptions?: AsyncOperationOptions
  ): Promise<{ data?: T; error?: AppError }> => {
    const mergedOptions = { ...options, ...operationOptions };
    
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      let result: T;
      
      if (mergedOptions.retryOptions) {
        result = await withRetry(operation, {
          ...mergedOptions.retryOptions,
          onRetry: (attempt, error) => {
            setState(prev => ({ ...prev, retryCount: attempt }));
            mergedOptions.retryOptions?.onRetry?.(attempt, error);
          },
        });
      } else {
        const { data, error } = await withErrorHandling(operation);
        if (error) {
          throw error;
        }
        result = data!;
      }

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        retryCount: 0,
      }));

      // Show success notification
      if (mergedOptions.showSuccessNotification && mergedOptions.successMessage) {
        notifications.success(mergedOptions.successMessage);
      }

      // Call success callback
      mergedOptions.onSuccess?.(result);

      return { data: result };
    } catch (error) {
      let appError: AppError;
      
      if (error && typeof error === "object" && "code" in error) {
        appError = error as AppError;
      } else {
        appError = AppErrorHandler.fromConvexError(error);
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: appError,
        retryCount: 0,
      }));

      // Show error notification
      if (mergedOptions.showErrorNotification !== false) {
        notifications.handleError(appError, () => {
          execute(operation, operationOptions);
        });
      }

      // Call error callback
      mergedOptions.onError?.(appError);

      return { error: appError };
    }
  }, [options, notifications]);

  const retry = useCallback(() => {
    if (state.error?.retryable) {
      // This will be set by the calling component
      console.log("Retry function needs to be implemented by the calling component");
    }
  }, [state.error]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
  };
}

/**
 * Hook specifically for Convex operations
 */
export function useConvexOperation<T = any>(options: AsyncOperationOptions = {}) {
  return useAsyncOperation<T>({
    ...options,
    retryOptions: {
      maxAttempts: 3,
      baseDelay: 1000,
      exponentialBackoff: true,
      retryCondition: (error) => {
        const message = error?.message || "";
        return !message.includes("Unauthenticated") && !message.includes("Invalid");
      },
      ...options.retryOptions,
    },
  });
}

/**
 * Hook specifically for upload operations
 */
export function useUploadOperation<T = any>(options: AsyncOperationOptions = {}) {
  return useAsyncOperation<T>({
    ...options,
    retryOptions: {
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 15000,
      retryCondition: (error) => {
        const message = error?.message || "";
        return !message.includes("too large") && !message.includes("invalid format");
      },
      ...options.retryOptions,
    },
  });
}

/**
 * Hook specifically for AI operations
 */
export function useAIOperation<T = any>(options: AsyncOperationOptions = {}) {
  return useAsyncOperation<T>({
    ...options,
    retryOptions: {
      maxAttempts: 2,
      baseDelay: 5000,
      maxDelay: 30000,
      retryCondition: (error) => {
        const message = error?.message || "";
        return message.includes("rate limit") || 
               message.includes("service unavailable") || 
               message.includes("timeout");
      },
      ...options.retryOptions,
    },
  });
}