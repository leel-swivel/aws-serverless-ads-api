import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "./createAd";
import { createAd } from "../services/ad.service";
import { validate } from "../utils/validate";
import { success, failure } from "../utils/response";
import { AppError } from "../utils/errors";

jest.mock("../services/ad.service");
jest.mock("../utils/validate");
jest.mock("../utils/response");

const mockCreateAd = createAd as jest.Mock;
const mockValidate = validate as jest.Mock;
const mockSuccess = success as jest.Mock;
const mockFailure = failure as jest.Mock;

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
    mockFailure.mockImplementation((error: any) => ({
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message }),
    }));
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

  it("should return 401 if userId is missing", async () => {
    const event = mockEvent({
      requestContext: {
        requestId: "req-123",
        authorizer: undefined,
      } as any,
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
    expect(mockCreateAd).not.toHaveBeenCalled();
  });

  it("should return 400 if validation fails", async () => {
    mockValidate.mockImplementation(() => {
      throw new AppError("Validation failed", 400);
    });

    const response = await handler(mockEvent());

    expect(response.statusCode).toBe(400);
    expect(mockCreateAd).not.toHaveBeenCalled();
  });
});
