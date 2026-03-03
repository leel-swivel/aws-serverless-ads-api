import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { AppError } from "./errors";
import { failure } from "./response";
import { log } from "./logger";

export function apiHandler(
  fn: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) {
  return async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext.requestId;
    const startTime = Date.now();

    log("INFO", "Incoming request", requestId, {
      path: event.path,
      method: event.httpMethod,
    });

    try {
      const response = await fn(event);

      log("INFO", "Request completed", requestId, {
        statusCode: response.statusCode,
        durationMs: Date.now() - startTime,
      });

      return response;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        log("WARN", "Handled application error", requestId, {
          code: error.code,
          message: error.message,
          durationMs: Date.now() - startTime,
        });

        return failure(error, requestId);
      }

      log("ERROR", "Unhandled system error", requestId, {
        error: error instanceof Error ? error.message : error,
        durationMs: Date.now() - startTime,
      });

      return failure(new AppError("Unexpected error occurred"), requestId);
    }
  };
}

export function authedApiHandler(
  fn: (
    event: APIGatewayProxyEvent,
    userId: string
  ) => Promise<APIGatewayProxyResult>
) {
  return apiHandler(async (event: APIGatewayProxyEvent) => {
    const requestId = event.requestContext.requestId;
    const userId = event.requestContext.authorizer?.claims?.sub as
      | string
      | undefined;

    if (!userId) {
      log("WARN", "Unauthorized access attempt", requestId, {
        path: event.path,
        method: event.httpMethod,
      });

      throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    return fn(event, userId);
  });
}
