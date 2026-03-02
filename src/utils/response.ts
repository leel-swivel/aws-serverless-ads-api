import { APIGatewayProxyResult } from "aws-lambda";
import { AppError, ValidationError } from "./errors";

export function success(
  data: any,
  requestId: string,
  statusCode = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "success",
      data,
      requestId,
    }),
  };
}

export function failure(
  error: AppError,
  requestId: string
): APIGatewayProxyResult {
  return {
    statusCode: error.statusCode || 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "error",
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message,
        ...(error instanceof ValidationError && error.details
          ? { details: error.details }
          : {}),
      },
      requestId,
    }),
  };
}
