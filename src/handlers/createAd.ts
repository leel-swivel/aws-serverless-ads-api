import { APIGatewayProxyEvent } from "aws-lambda";
import { createAdSchema } from "../models/ad.schema";
import { success } from "../utils/response";
import { apiHandler } from "../utils/handlerWrapper";
import { createAd } from "../services/ad.service";
import { HTTP_STATUS } from "../constants/httpStatus";
import { validate } from "../utils/validate";
import { AppError } from "../utils/errors";

export const handler = apiHandler(async (event: APIGatewayProxyEvent) => {
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const requestId = event.requestContext.requestId;

  const data = validate(createAdSchema, event.body);

  const ad = await createAd({
    ...data,
    userId,
  });

  return success(ad, requestId, HTTP_STATUS.CREATED);
});
