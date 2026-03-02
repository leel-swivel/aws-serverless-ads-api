import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});
const TOPIC_ARN = process.env.ADS_TOPIC!;

export async function publishAdCreated(adId: string, userId: string) {
  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify({
        event: "AD_CREATED",
        adId,
        userId,
      }),
    })
  );
}