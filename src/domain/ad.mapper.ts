import { AdEntity, AdImageDto, AdResponse } from "./ad.types";

export function mapToAdResponse(
  entity: AdEntity,
  image?: AdImageDto
): AdResponse {
  return {
    id: entity.id,
    title: entity.title,
    price: entity.price,
    userId: entity.userId,
    createdAt: entity.createdAt,
    image,
  };
}
