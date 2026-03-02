const snsSendMock = jest.fn().mockResolvedValue({});

jest.mock("@aws-sdk/client-sns", () => {
  class SNSClient {
    send = snsSendMock;
  }

  const PublishCommand = jest.fn((input) => input);

  return {
    SNSClient,
    PublishCommand,
    __esModule: true,
  };
});

describe("publishAdCreated", () => {
  beforeEach(() => {
    jest.resetModules();
    snsSendMock.mockClear();
    process.env.ADS_TOPIC = "test-topic";
  });

  it("should publish AD_CREATED event with correct payload", async () => {
    const { publishAdCreated } = await import("./ad.publisher");

    await publishAdCreated("ad-1", "user-1");

    expect(snsSendMock).toHaveBeenCalledTimes(1);
    const arg = snsSendMock.mock.calls[0][0] as any;
    expect(arg.TopicArn).toBe("test-topic");

    const message = JSON.parse(arg.Message);
    expect(message.event).toBe("AD_CREATED");
    expect(message.adId).toBe("ad-1");
    expect(message.userId).toBe("user-1");
  });
});

