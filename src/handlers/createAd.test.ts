import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./createAd";
import { createAd } from "../services/ad.service";
import { validate } from "../utils/validate";
import { success } from "../utils/response";

jest.mock("../services/ad.service");
jest.mock("../utils/validate");
jest.mock("../utils/response");

const mockCreateAd = createAd as jest.Mock;
const mockValidate = validate as jest.Mock;
const mockSuccess = success as jest.Mock;

describe("CreateAd Handler", () => {
  const mockEvent = (overrides?: Partial<APIGatewayProxyEvent>) =>
    ({
      body: JSON.stringify({
        title: "Test Ad",
        price: 100,
      }),
      path: "/api/v1/ads",
      httpMethod: "POST",
      requestContext: {
        requestId: "req-123",
        authorizer: {
          claims: {
            sub: "user-123",
          },
        },
      },
      ...overrides,
    } as unknown as APIGatewayProxyEvent);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create ad successfully", async () => {
    const validatedData = {
      title: "Test Ad",
      price: 100,
    };

    const serviceResponse = {
      id: "ad-1",
      title: "Test Ad",
      price: 100,
      userId: "user-123",
      createdAt: "2025-01-01T00:00:00Z",
    };

    mockValidate.mockReturnValue(validatedData);
    mockCreateAd.mockResolvedValue(serviceResponse);
    mockSuccess.mockReturnValue({
      statusCode: 201,
      body: JSON.stringify(serviceResponse),
    });

    const response = await handler(mockEvent());

    expect(mockValidate).toHaveBeenCalled();
    expect(mockCreateAd).toHaveBeenCalledWith(
      {
        ...validatedData,
        userId: "user-123",
      },
      {
        requestId: "req-123",
      }
    );

    expect(response).toEqual({
      statusCode: 201,
      body: JSON.stringify(serviceResponse),
    });
  });

  it("should throw error if userId is missing", async () => {
    const event = mockEvent({
      requestContext: {
        requestId: "req-123",
        authorizer: undefined,
      } as any,
    });

    await expect(handler(event)).rejects.toThrow("Unauthorized");
  });

  it("should validate input before calling service", async () => {
    mockValidate.mockImplementation(() => {
      throw new Error("Validation failed");
    });

    await expect(handler(mockEvent())).rejects.toThrow("Validation failed");

    expect(mockCreateAd).not.toHaveBeenCalled();
  });
});
