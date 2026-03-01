import { handler } from "./createAd";
import { createAd } from "../services/ad.service";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("../services/ad.service");

const mockCreateAd = createAd as jest.Mock;

const baseEvent = {
  requestContext: {
    requestId: "req-123",
    authorizer: {
      claims: {
        sub: "user-123",
      },
    },
  },
  body: JSON.stringify({
    title: "Test Ad",
    price: 100,
  }),
} as unknown as APIGatewayProxyEvent;

describe("createAd handler", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 201 on success", async () => {
    mockCreateAd.mockResolvedValue({
      id: "ad-1",
      title: "Test Ad",
      price: 100,
      userId: "user-123",
      createdAt: "now",
    });

    const response = await handler(baseEvent);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).data.id).toBe("ad-1");
  });

  it("should return 401 if userId missing", async () => {
    const event = {
      ...baseEvent,
      requestContext: {
        ...baseEvent.requestContext,
        authorizer: undefined,
      },
    } as any;

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
  });

  it("should return 400 on validation error", async () => {
    const event = {
      ...baseEvent,
      body: JSON.stringify({}), // missing required fields
    } as any;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  it("should return 500 if service throws unknown error", async () => {
    mockCreateAd.mockRejectedValue(new Error("Unexpected"));

    const response = await handler(baseEvent);

    expect(response.statusCode).toBe(500);
  });

});