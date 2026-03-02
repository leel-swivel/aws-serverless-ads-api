import { mapToAdResponse } from "./ad.mapper";
import { AdEntity, AdImageDto } from "./ad.types";

describe("mapToAdResponse", () => {
  const baseEntity: AdEntity = {
    id: "1",
    title: "Test Ad",
    price: 100,
    userId: "user-1",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  it("should map entity to response without image", () => {
    const result = mapToAdResponse(baseEntity);

    expect(result).toEqual({
      id: baseEntity.id,
      title: baseEntity.title,
      price: baseEntity.price,
      userId: baseEntity.userId,
      createdAt: baseEntity.createdAt,
      image: undefined,
    });
  });

  it("should map entity to response with image", () => {
    const image: AdImageDto = {
      key: "ads/1.jpg",
      presignedUrl: "http://example.com",
      expiresIn: 3600,
    };

    const result = mapToAdResponse(baseEntity, image);

    expect(result.image).toEqual(image);
  });
});

