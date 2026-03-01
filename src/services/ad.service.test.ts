import { createAd } from "./ad.service";
import { ValidationError, AppError } from "../utils/errors";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { PublishCommand } from "@aws-sdk/client-sns";

/* =============================
   MOCK AWS SDK CLIENTS
============================= */

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const original = jest.requireActual("@aws-sdk/lib-dynamodb");
  return {
    ...original,
    DynamoDBDocumentClient: {
      from: () => ({
        send: jest.fn().mockResolvedValue({}),
      }),
    },
  };
});

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/client-sns", () => {
  return {
    SNSClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PublishCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://mock-presigned-url"),
}));

/* =============================
   ENV VARIABLES
============================= */

process.env.ADS_TABLE = "test-table";
process.env.ADS_BUCKET = "test-bucket";
process.env.ADS_TOPIC = "test-topic";
process.env.IMAGE_MAX_SIZE = "5242880";
process.env.PRESIGNED_URL_EXPIRY = "3600";

/* =============================
   TESTS
============================= */

describe("createAd service", () => {
  const baseInput = {
    title: "Test Ad",
    price: 100,
    userId: "user-123",
    requestId: "req-123",
  };

  it("should create ad successfully without image", async () => {
    const result = await createAd(baseInput);

    expect(result.id).toBeDefined();
    expect(result.title).toBe("Test Ad");
    expect(result.price).toBe(100);
    expect(result.image).toBeUndefined();
  });

  it("should create ad successfully with image", async () => {
    const imageBase64 = Buffer.from("test").toString("base64");

    const result = await createAd({
      ...baseInput,
      imageBase64,
    });

    expect(result.image).toBeDefined();
    expect(result.image?.presignedUrl).toBe("https://mock-presigned-url");
    expect(result.image?.expiresIn).toBe(3600);
  });

  it("should throw ValidationError if image too large", async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const imageBase64 = largeBuffer.toString("base64");

    await expect(
      createAd({
        ...baseInput,
        imageBase64,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("should throw AppError if userId missing", async () => {
    await expect(
      createAd({
        ...baseInput,
        userId: "" as any,
      })
    ).rejects.toBeInstanceOf(AppError);
  });
});