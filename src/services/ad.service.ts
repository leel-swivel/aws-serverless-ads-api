import { randomUUID } from "crypto";
import { ValidationError } from "../utils/errors";

export async function createAd(data: {
  title: string;
  price: number;
}) {
  if (data.price > 1000000) {
    throw new ValidationError("Price too high");
  }

  return {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };
}