export type LogLevel = "INFO" | "ERROR" | "WARN" | "DEBUG";

export function log(
  level: LogLevel,
  message: string,
  requestId?: string,
  meta?: Record<string, unknown>
) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId,
      ...meta,
    })
  );
}
