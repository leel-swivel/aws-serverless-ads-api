import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { AdEntity } from "../domain/ad.types";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.ADS_TABLE!;

export async function saveAd(entity: AdEntity) {
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: entity,
    })
  );
}
