import { randomUUID } from "crypto";
import { saveAd } from "../repositories/ad.repository";
import { uploadImage } from "../storage/image.storage";
import { publishAdCreated } from "../events/ad.publisher";
import { log } from "../utils/logger";

import { CreateAdServiceInput, AdEntity, AdImageDto } from "../domain/ad.types";

import { mapToAdResponse } from "../domain/ad.mapper";

export async function createAd(
  data: CreateAdServiceInput,
  context: { requestId: string }
) {
  const { requestId } = context;

  log("INFO", "CreateAd started", requestId, {
    userId: data.userId,
  });

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  let imageDto: AdImageDto | undefined;

  if (data.imageBase64) {
    imageDto = await uploadImage(id, data.imageBase64);
  }

  const entity: AdEntity = {
    id,
    title: data.title,
    price: data.price,
    imageKey: imageDto?.key,
    userId: data.userId,
    createdAt,
  };

  await saveAd(entity);
  await publishAdCreated(id, data.userId);

  return mapToAdResponse(entity, imageDto);
}
