import { apiHandler } from "./handlerWrapper";
import { AppError } from "./errors";

describe("apiHandler", () => {
  const event: any = {
    path: "/test",
    httpMethod: "GET",
    requestContext: { requestId: "req-1" },
  };

  it("should handle success", async () => {
    const fn = jest.fn().mockResolvedValue({
      statusCode: 200,
      body: "ok",
    });

    const handler = apiHandler(fn);

    const res = await handler(event);

    expect(res.statusCode).toBe(200);
  });

  it("should handle AppError", async () => {
    const fn = jest.fn().mockRejectedValue(new AppError("Fail", 400));

    const handler = apiHandler(fn);

    const res = await handler(event);

    expect(res.statusCode).toBe(400);
  });

  it("should handle unknown error", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("System error"));

    const handler = apiHandler(fn);

    const res = await handler(event);

    expect(res.statusCode).toBe(500);
  });
});
