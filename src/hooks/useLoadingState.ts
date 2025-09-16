/**
 * Hook for managing loading states across the application
 */

import { useState, useCallback, useRef } from "react";

export interface LoadingState {
  [key: string]: boolean;
}

export function useLoadingState(initialState: LoadingState = {}) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const setLoading = useCallback((key: string, loading: boolean, timeout?: number) => {
    // Clear any existing timeout for this key
    const existingTimeout = timeoutsRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(key);
    }

    if (loading && timeout) {
      // Set a timeout to automatically clear the loading state
      const timeoutId = setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [key]: false }));
        timeoutsRef.current.delete(key);
      }, timeout);
      timeoutsRef.current.set(key, timeoutId);
    }

    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const clearAllLoading = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setLoadingStates({});
  }, []);

  const withLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    timeout?: number
  ): Promise<T> => {
    setLoading(key, true, timeout);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
    withLoading,
  };
}

/**
 * Hook for managing global loading states
 */
export function useGlobalLoading() {
  return useLoadingState({
    app: false,
    auth: false,
    upload: false,
    staging: false,
    export: false,
  });
}

/**
 * Hook for managing upload progress
 */
export interface UploadProgress {
  [filename: string]: {
    progress: number;
    status: "uploading" | "completed" | "error";
    error?: string;
  };
}

export function useUploadProgress() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  const updateProgress = useCallback((filename: string, progress: number) => {
    setUploadProgress(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        progress,
        status: progress >= 100 ? "completed" : "uploading",
      },
    }));
  }, []);

  const setError = useCallback((filename: string, error: string) => {
    setUploadProgress(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        status: "error",
        error,
      },
    }));
  }, []);

  const removeFile = useCallback((filename: string) => {
    setUploadProgress(prev => {
      const newState = { ...prev };
      delete newState[filename];
      return newState;
    });
  }, []);

  const clearAll = useCallback(() => {
    setUploadProgress({});
  }, []);

  const getOverallProgress = useCallback(() => {
    const files = Object.values(uploadProgress);
    if (files.length === 0) return 0;
    
    const totalProgress = files.reduce((sum, file) => sum + file.progress, 0);
    return totalProgress / files.length;
  }, [uploadProgress]);

  const getStats = useCallback(() => {
    const files = Object.values(uploadProgress);
    return {
      total: files.length,
      completed: files.filter(f => f.status === "completed").length,
      uploading: files.filter(f => f.status === "uploading").length,
      failed: files.filter(f => f.status === "error").length,
    };
  }, [uploadProgress]);

  return {
    uploadProgress,
    updateProgress,
    setError,
    removeFile,
    clearAll,
    getOverallProgress,
    getStats,
  };
}

/**
 * Hook for managing batch operation progress
 */
export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  items: {
    [id: string]: {
      status: "pending" | "in-progress" | "completed" | "error";
      error?: string;
    };
  };
}

export function useBatchProgress(initialTotal: number = 0) {
  const [progress, setProgress] = useState<BatchProgress>({
    total: initialTotal,
    completed: 0,
    failed: 0,
    inProgress: 0,
    items: {},
  });

  const updateItem = useCallback((
    id: string, 
    status: BatchProgress["items"][string]["status"],
    error?: string
  ) => {
    setProgress(prev => {
      const newItems = { ...prev.items };
      const oldStatus = newItems[id]?.status || "pending";
      
      newItems[id] = { status, error };

      // Update counters
      let { completed, failed, inProgress } = prev;
      
      // Remove from old status count
      if (oldStatus === "completed") completed--;
      else if (oldStatus === "error") failed--;
      else if (oldStatus === "in-progress") inProgress--;
      
      // Add to new status count
      if (status === "completed") completed++;
      else if (status === "error") failed++;
      else if (status === "in-progress") inProgress++;

      return {
        ...prev,
        completed,
        failed,
        inProgress,
        items: newItems,
      };
    });
  }, []);

  const reset = useCallback((total: number = 0) => {
    setProgress({
      total,
      completed: 0,
      failed: 0,
      inProgress: 0,
      items: {},
    });
  }, []);

  const getPercentage = useCallback(() => {
    if (progress.total === 0) return 0;
    return ((progress.completed + progress.failed) / progress.total) * 100;
  }, [progress]);

  return {
    progress,
    updateItem,
    reset,
    getPercentage,
  };
}