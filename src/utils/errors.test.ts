import { AppError, ValidationError } from "./errors";

describe("AppError", () => {
  it("should set default values", () => {
    const err = new AppError("Test");

    expect(err.message).toBe("Test");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
  });

  it("should set custom values", () => {
    const err = new AppError("Fail", 400, "CUSTOM");

    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("CUSTOM");
  });
});

describe("ValidationError", () => {
  it("should set validation details", () => {
    const details = [{ field: "title", message: "Required" }];

    const err = new ValidationError("Validation failed", details);

    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(details);
  });
});
