import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry, withConvexRetry, withUploadRetry, withAIRetry, CircuitBreaker } from "./retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should succeed on first attempt", async () => {
    const operation = vi.fn().mockResolvedValue("success");
    const result = await withRetry(operation);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable errors", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue("success");

    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      retryCondition: (error) => error.message.includes("Network"),
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-retryable errors", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Authentication failed"));

    await expect(withRetry(operation, {
      maxAttempts: 3,
      retryCondition: (error) => !error.message.includes("Authentication"),
    })).rejects.toThrow("Authentication failed");

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should respect maxAttempts", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(withRetry(operation, {
      maxAttempts: 2,
      baseDelay: 10,
      retryCondition: () => true,
    })).rejects.toThrow("Network error");

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should call onRetry callback", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValue("success");
    const onRetry = vi.fn();

    await withRetry(operation, {
      maxAttempts: 3,
      baseDelay: 10,
      retryCondition: () => true,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

describe("withConvexRetry", () => {
  it("should retry on server errors", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce({ message: "Internal server error" })
      .mockResolvedValue("success");

    const result = await withConvexRetry(operation, {
      baseDelay: 10,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on authentication errors", async () => {
    const operation = vi.fn().mockRejectedValue({ message: "Unauthenticated" });

    await expect(withConvexRetry(operation)).rejects.toMatchObject({
      message: "Unauthenticated",
    });

    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe("withUploadRetry", () => {
  it("should retry on network errors", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce({ name: "NetworkError" })
      .mockResolvedValue("success");

    const result = await withUploadRetry(operation, {
      baseDelay: 10,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on file size errors", async () => {
    const operation = vi.fn().mockRejectedValue({ message: "File too large" });

    await expect(withUploadRetry(operation)).rejects.toMatchObject({
      message: "File too large",
    });

    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe("withAIRetry", () => {
  it("should retry on rate limit errors", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce({ message: "API rate limit exceeded" })
      .mockResolvedValue("success");

    const result = await withAIRetry(operation, {
      baseDelay: 10, // Speed up test
      maxDelay: 100,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry on invalid input errors", async () => {
    const operation = vi.fn().mockRejectedValue({ message: "Invalid image format" });

    await expect(withAIRetry(operation)).rejects.toMatchObject({
      message: "Invalid image format",
    });

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should have limited retry attempts", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Service unavailable"));

    await expect(withAIRetry(operation, {
      baseDelay: 1, // Speed up test even more
      maxDelay: 10,
    })).rejects.toThrow("Service unavailable");

    expect(operation).toHaveBeenCalledTimes(2); // maxAttempts: 2 for AI operations
  });
});

describe("CircuitBreaker", () => {
  it("should allow operations when closed", async () => {
    const circuitBreaker = new CircuitBreaker(3, 1000);
    const operation = vi.fn().mockResolvedValue("success");

    const result = await circuitBreaker.execute(operation);

    expect(result).toBe("success");
    expect(circuitBreaker.getState().state).toBe("closed");
  });

  it("should open after failure threshold", async () => {
    const circuitBreaker = new CircuitBreaker(2, 1000);
    const operation = vi.fn().mockRejectedValue(new Error("Test error"));

    // First failure
    await expect(circuitBreaker.execute(operation)).rejects.toThrow("Test error");
    expect(circuitBreaker.getState().state).toBe("closed");

    // Second failure - should open circuit
    await expect(circuitBreaker.execute(operation)).rejects.toThrow("Test error");
    expect(circuitBreaker.getState().state).toBe("open");

    // Third attempt should be rejected immediately
    await expect(circuitBreaker.execute(operation)).rejects.toThrow("Circuit breaker is open");
    expect(operation).toHaveBeenCalledTimes(2); // Should not call operation when open
  });

  it("should reset on success", async () => {
    const circuitBreaker = new CircuitBreaker(3, 1000);
    const failingOperation = vi.fn().mockRejectedValue(new Error("Test error"));
    const successOperation = vi.fn().mockResolvedValue("success");

    // Fail once
    await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow("Test error");
    expect(circuitBreaker.getState().failures).toBe(1);

    // Succeed
    await circuitBreaker.execute(successOperation);
    expect(circuitBreaker.getState().failures).toBe(0);
    expect(circuitBreaker.getState().state).toBe("closed");
  });
});