import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "../utils/errors";

const s3 = new S3Client({});

const BUCKET_NAME = process.env.ADS_BUCKET!;
const IMAGE_MAX_SIZE = Number(process.env.IMAGE_MAX_SIZE ?? 5 * 1024 * 1024);
const PRESIGNED_URL_EXPIRY = Number(process.env.PRESIGNED_URL_EXPIRY ?? 3600);

const ALLOWED_TYPES = new Set(
  (process.env.ALLOWED_IMAGE_TYPES ?? "")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean)
);

function parseBase64Image(base64: string): {
  mimeType: string;
  data: string;
} {
  const regex = /^data:(image\/[a-zA-Z+]+);base64,(.*)$/;
  const matches = regex.exec(base64);

  if (!matches) {
    throw new AppError("Invalid image format", 400, "INVALID_IMAGE_FORMAT");
  }

  const mimeType = matches[1];
  const data = matches[2];

  if (!ALLOWED_TYPES.has(mimeType)) {
    throw new AppError(
      `Unsupported image type: ${mimeType}`,
      400,
      "UNSUPPORTED_IMAGE"
    );
  }

  return { mimeType, data };
}

export async function uploadImage(id: string, base64: string) {
  const { mimeType, data } = parseBase64Image(base64);

  const buffer = Buffer.from(data, "base64");

  if (!buffer || buffer.length === 0) {
    throw new AppError("Invalid image data", 400, "INVALID_IMAGE_DATA");
  }

  if (buffer.length > IMAGE_MAX_SIZE) {
    throw new AppError("Image too large", 400, "IMAGE_TOO_LARGE");
  }

  const extension = mimeType === "image/png" ? "png" : "jpg";
  const key = `ads/${id}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
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