import { createAd } from "./ad.service";
import { saveAd } from "../repositories/ad.repository";
import { uploadImage } from "../storage/image.storage";
import { publishAdCreated } from "../events/ad.publisher";
import { mapToAdResponse } from "../domain/ad.mapper";

jest.mock("../repositories/ad.repository");
jest.mock("../storage/image.storage");
jest.mock("../events/ad.publisher");
jest.mock("../domain/ad.mapper");
jest.mock("../utils/logger");

const mockSaveAd = saveAd as jest.Mock;
const mockUploadImage = uploadImage as jest.Mock;
const mockPublish = publishAdCreated as jest.Mock;
const mockMapper = mapToAdResponse as jest.Mock;

describe("createAd service", () => {
  const baseInput = {
    title: "Test Ad",
    price: 100,
    userId: "user-123",
  };

  const context = {
    requestId: "req-123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create ad without image", async () => {
    const mappedResponse = {
      id: "generated-id",
      title: "Test Ad",
      price: 100,
      userId: "user-123",
      createdAt: "2025-01-01",
    };

    mockMapper.mockReturnValue(mappedResponse);

    const result = await createAd(baseInput, context);

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockSaveAd).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith(expect.any(String), "user-123");
    expect(mockMapper).toHaveBeenCalled();

    expect(result).toEqual(mappedResponse);
  });

  it("should upload image if imageBase64 exists", async () => {
    const imageDto = {
      key: "ads/id.jpg",
      presignedUrl: "url",
      expiresIn: 3600,
    };

    mockUploadImage.mockResolvedValue(imageDto);
    mockMapper.mockReturnValue({ id: "1" });

    await createAd(
      {
        ...baseInput,
        imageBase64: "base64string",
      },
      context
    );

    expect(mockUploadImage).toHaveBeenCalled();
    expect(mockSaveAd).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalled();
  });

  it("should propagate error if saveAd fails", async () => {
    mockSaveAd.mockRejectedValue(new Error("DB error"));

    await expect(createAd(baseInput, context)).rejects.toThrow("DB error");

    expect(mockPublish).not.toHaveBeenCalled();
  });
});
