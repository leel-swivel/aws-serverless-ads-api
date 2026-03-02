// handlers/createAd.ts

import { APIGatewayProxyEvent } from "aws-lambda";
import { createAdSchema } from "../models/ad.schema";
import { success } from "../utils/response";
import { apiHandler } from "../utils/handlerWrapper";
import { createAd } from "../services/ad.service";
import { HTTP_STATUS } from "../constants/httpStatus";
import { validate } from "../utils/validate";
import { AppError } from "../utils/errors";

export const handler = apiHandler(async (event: APIGatewayProxyEvent) => {
  const requestId = event.requestContext.requestId;

  console.info(
    JSON.stringify({
      level: "INFO",
      message: "CreateAd request received",
      requestId,
      path: event.path,
      method: event.httpMethod,
    })
  );

  // Extract userId from Cognito authorizer
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    console.warn(
      JSON.stringify({
        level: "WARN",
        message: "Unauthorized access attempt",
        requestId,
      })
    );

    throw new AppError("Unauthorized", 401);
  }

  // Validate request body
  const validatedData = validate(createAdSchema, event.body);

  console.info(
    JSON.stringify({
      level: "INFO",
      message: "Validation successful",
      requestId,
      userId,
    })
  );

  // Call service with clean separation
  const ad = await createAd(
    {
      ...validatedData,
      userId,
    },
    {
      requestId,
    }
  );

  console.info(
    JSON.stringify({
      level: "INFO",
      message: "Ad created successfully",
      requestId,
      adId: ad.id,
      userId,
    })
  );

  return success(ad, requestId, HTTP_STATUS.CREATED);
});
