import { randomUUID } from "crypto";
import { ValidationError, AppError } from "../utils/errors";
import { log } from "../utils/logger";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

/* =====================================================
   =============== AWS CLIENTS =========================
   ===================================================== */

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const sns = new SNSClient({});

/* =====================================================
   =============== CONFIG ==============================
   ===================================================== */

const IMAGE_MAX_SIZE = Number(process.env.IMAGE_MAX_SIZE ?? 5 * 1024 * 1024);
const PRESIGNED_URL_EXPIRY = Number(process.env.PRESIGNED_URL_EXPIRY ?? 3600);

const TABLE_NAME = process.env.ADS_TABLE!;
const BUCKET_NAME = process.env.ADS_BUCKET!;
const TOPIC_ARN = process.env.ADS_TOPIC!;

/* =====================================================
   =============== DOMAIN MODELS =======================
   ===================================================== */

export interface CreateAdInput {
  title: string;
  price: number;
  imageBase64?: string;
  userId: string;
  requestId: string;
}

export interface AdEntity {
  id: string;
  title: string;
  price: number;
  imageKey?: string;
  userId: string;
  createdAt: string;
}

export interface AdImageDto {
  key: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface AdResponse {
  id: string;
  title: string;
  price: number;
  userId: string;
  createdAt: string;
  image?: AdImageDto;
}

/* =====================================================
   =============== MAPPER ==============================
   ===================================================== */

function mapToAdResponse(entity: AdEntity, image?: AdImageDto): AdResponse {
  return {
    id: entity.id,
    title: entity.title,
    price: entity.price,
    userId: entity.userId,
    createdAt: entity.createdAt,
    image,
  };
}

/* =====================================================
   =============== SERVICE =============================
   ===================================================== */

export async function createAd(
  data: CreateAdInput
): Promise<AdResponse> {
  const startTime = Date.now();

  log("INFO", "CreateAd started", data.requestId, {
    userId: data.userId,
    title: data.title,
  });

  if (!data.userId) {
    log("WARN", "Unauthorized createAd attempt", data.requestId);
    throw new AppError("Unauthorized", 401);
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  let imageKey: string | undefined;
  let imageDto: AdImageDto | undefined;

  /* ==============================
     1️⃣ Upload image
     ============================== */

  if (data.imageBase64) {
    log("INFO", "Image upload started", data.requestId);

    const buffer = Buffer.from(data.imageBase64, "base64");

    if (buffer.length > IMAGE_MAX_SIZE) {
      log("WARN", "Image too large", data.requestId, {
        size: buffer.length,
        maxAllowed: IMAGE_MAX_SIZE,
      });

      throw new ValidationError(
        `Image too large (max ${IMAGE_MAX_SIZE / (1024 * 1024)}MB)`
      );
    }

    imageKey = `ads/${id}.jpg`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    log("INFO", "Image uploaded successfully", data.requestId, {
      imageKey,
    });

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
      }),
      { expiresIn: PRESIGNED_URL_EXPIRY }
    );

    imageDto = {
      key: imageKey,
      presignedUrl,
      expiresIn: PRESIGNED_URL_EXPIRY,
    };
  }

  /* ==============================
     2️⃣ Save to DynamoDB
     ============================== */

  const entity: AdEntity = {
    id,
    title: data.title,
    price: data.price,
    imageKey,
    userId: data.userId,
    createdAt,
  };

  log("INFO", "Saving ad to DynamoDB", data.requestId, { id });

  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    })
  );

  log("INFO", "Ad saved to DynamoDB", data.requestId, { id });

  /* ==============================
     3️⃣ Publish SNS
     ============================== */

  log("INFO", "Publishing SNS event", data.requestId, { id });

  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify({
        event: "AD_CREATED",
        adId: id,
        userId: data.userId,
      }),
    })
  );

  log("INFO", "SNS event published", data.requestId, { id });

  const duration = Date.now() - startTime;

  log("INFO", "CreateAd completed", data.requestId, {
    id,
    durationMs: duration,
  });

  return mapToAdResponse(entity, imageDto);
}