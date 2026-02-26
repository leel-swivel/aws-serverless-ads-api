import { APIGatewayProxyEvent } from "aws-lambda";
import { createAdSchema } from "../models/ad.schema";
import { success } from "../utils/response";
import { apiHandler } from "../utils/handlerWrapper";
import { createAd } from "../services/ad.service";
import { HTTP_STATUS } from "../constants/httpStatus";
import { validate } from "../utils/validate";



export const handler = apiHandler(
  async (event: APIGatewayProxyEvent) => {

    const requestId = event.requestContext.requestId;
    const data = validate(createAdSchema, event.body);
    const ad = await createAd(data);
    return success(ad, requestId, HTTP_STATUS.CREATED);
  }
);