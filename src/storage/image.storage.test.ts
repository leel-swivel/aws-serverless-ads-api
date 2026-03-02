jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("mock-url"),
}));

jest.mock("@aws-sdk/client-s3", () => {
  const sendMock = jest.fn().mockResolvedValue({});

  class S3Client {
    send = sendMock;
  }

  return {
    S3Client,
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    __esModule: true,
  };
});

describe("uploadImage", () => {
  beforeEach(() => {
    jest.resetModules(); // important for env reload
    process.env.ADS_BUCKET = "test-bucket";
    process.env.ALLOWED_IMAGE_TYPES = "image/jpeg,image/png";
    process.env.IMAGE_MAX_SIZE = "1000000";
  });

  it("should throw for invalid base64 format", async () => {
    const { uploadImage } = await import("./image.storage");

    await expect(uploadImage("1", "invalid")).rejects.toThrow(
      "Invalid image format"
    );
  });

  it("should throw for unsupported mime type", async () => {
    const { uploadImage } = await import("./image.storage");

    const base64 = "data:image/gif;base64,abcd";

    await expect(uploadImage("1", base64)).rejects.toMatchObject({
      code: "UNSUPPORTED_IMAGE",
      statusCode: 400,
    });
  });

  it("should throw for empty image data", async () => {
    const { uploadImage } = await import("./image.storage");

    const base64 = "data:image/jpeg;base64,";

    await expect(uploadImage("1", base64)).rejects.toMatchObject({
      code: "INVALID_IMAGE_DATA",
      statusCode: 400,
    });
  });

  it("should throw when image is too large", async () => {
    process.env.IMAGE_MAX_SIZE = "1"; // very small limit

    const { uploadImage } = await import("./image.storage");

    const base64 =
      "data:image/jpeg;base64," +
      Buffer.from("largecontent").toString("base64");

    await expect(uploadImage("1", base64)).rejects.toMatchObject({
      code: "IMAGE_TOO_LARGE",
      statusCode: 400,
    });
  });

  it("should upload successfully", async () => {
    const { uploadImage } = await import("./image.storage");

    const base64 =
      "data:image/jpeg;base64," + Buffer.from("test-image").toString("base64");

    const result = await uploadImage("123", base64);

    expect(result.key).toBe("ads/123.jpg");
    expect(result.presignedUrl).toBeDefined();
  });
});
