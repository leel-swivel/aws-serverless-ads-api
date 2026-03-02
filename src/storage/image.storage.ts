// storage/image.storage.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.ADS_BUCKET!;
const IMAGE_MAX_SIZE = Number(process.env.IMAGE_MAX_SIZE ?? 5 * 1024 * 1024);
const PRESIGNED_URL_EXPIRY = Number(process.env.PRESIGNED_URL_EXPIRY ?? 3600);

export async function uploadImage(
  id: string,
  base64: string
) {
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > IMAGE_MAX_SIZE) {
    throw new Error("Image too large");
  }

  const key = `ads/${id}.jpg`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );

  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: PRESIGNED_URL_EXPIRY }
  );

  return {
    key,
    presignedUrl,
    expiresIn: PRESIGNED_URL_EXPIRY,
  };
}