export type LogLevel = "debug" | "info" | "warn" | "error";

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (/key|secret|token|authorization/i.test(value)) return "[REDACTED]";
    try {
      const u = new URL(value);
      u.search = "";
      u.hash = "";
      return u.toString();
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = /key|secret|token|authorization/i.test(k) ? "[REDACTED]" : redactValue(v);
    }
    return out;
  }
  return value;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...(context ? { context: redactValue(context) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};


