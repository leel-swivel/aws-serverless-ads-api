import { success, failure } from "./response";
import { AppError, ValidationError } from "./errors";

describe("response utils", () => {
  it("should return success response", () => {
    const res = success({ id: 1 }, "req-1", 201);

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).status).toBe("success");
  });

  it("should return failure response", () => {
    const err = new AppError("Fail", 400, "CUSTOM");

    const res = failure(err, "req-1");

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).status).toBe("error");
  });

  it("should include validation details", () => {
    const err = new ValidationError("Invalid", [
      { field: "name", message: "Required" },
    ]);

    const res = failure(err, "req-1");

    const body = JSON.parse(res.body);
    expect(body.error.details).toBeDefined();
  });
});
