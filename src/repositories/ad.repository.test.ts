const dynamoSendMock = jest.fn().mockResolvedValue({});

jest.mock("@aws-sdk/client-dynamodb", () => {
  class DynamoDBClient {}

  return {
    DynamoDBClient,
    __esModule: true,
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const DynamoDBDocumentClient = {
    from: () => ({
      send: dynamoSendMock,
    }),
  };

  const PutCommand = jest.fn((input) => input);

  return {
    DynamoDBDocumentClient,
    PutCommand,
    __esModule: true,
  };
});

describe("saveAd", () => {

  beforeEach(() => {
    jest.resetModules();
    dynamoSendMock.mockClear();
    process.env.ADS_TABLE = "test-table";
  });

  it("should send PutCommand with correct table and item", async () => {
    const { saveAd } = await import("./ad.repository");

    const entity = {
      id: "1",
      title: "Test",
      price: 100,
      userId: "user-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    await saveAd(entity as any);

    expect(dynamoSendMock).toHaveBeenCalledTimes(1);
    const arg = dynamoSendMock.mock.calls[0][0] as any;
    expect(arg.TableName).toBe("test-table");
    expect(arg.Item).toEqual(entity);
  });
});

