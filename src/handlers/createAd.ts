import { APIGatewayProxyEvent } from "aws-lambda";
import { createAdSchema } from "../models/ad.schema";
import { success } from "../utils/response";
import { authedApiHandler } from "../utils/handlerWrapper";
import { createAd } from "../services/ad.service";
import { HTTP_STATUS } from "../constants/httpStatus";
import { validate } from "../utils/validate";

export const handler = authedApiHandler(
  async (event: APIGatewayProxyEvent, userId: string) => {
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

    const validatedData = validate(createAdSchema, event.body);

    console.info(
      JSON.stringify({
        level: "INFO",
        message: "Validation successful",
        requestId,
        userId,
      })
    );

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
  }
);
