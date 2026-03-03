import { apiHandler, authedApiHandler } from "./handlerWrapper";
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

  describe("authedApiHandler", () => {
    const authedEvent: any = {
      ...event,
      requestContext: {
        ...event.requestContext,
        authorizer: {
          claims: {
            sub: "user-1",
          },
        },
      },
    };

    it("should pass userId to handler when present", async () => {
      const fn = jest.fn().mockResolvedValue({
        statusCode: 200,
        body: "ok",
      });

      const handler = authedApiHandler(fn);

      const res = await handler(authedEvent);

      expect(res.statusCode).toBe(200);
      expect(fn).toHaveBeenCalledWith(authedEvent, "user-1");
    });

    it("should return 401 when userId is missing", async () => {
      const fn = jest.fn();

      const handler = authedApiHandler(fn);

      const res = await handler(event);

      expect(res.statusCode).toBe(401);
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
