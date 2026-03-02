import { z } from "zod";
import { validate } from "./validate";
import { ValidationError } from "./errors";

describe("validate", () => {
  it("should throw when body is null", () => {
    const schema = z.object({ title: z.string() });

    expect(() => validate(schema, null)).toThrow(ValidationError);
    expect(() => validate(schema, null)).toThrow("Request body is required");
  });

  it("should throw validation error with details for invalid body", () => {
    const schema = z.object({ title: z.string() });
    const body = JSON.stringify({});

    try {
      validate(schema, body);
      fail("Expected ValidationError");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const validationError = err as ValidationError;
      expect(validationError.details).toBeDefined();
      expect(validationError.details![0].field).toBe("title");
    }
  });

  it("should return parsed data for valid body", () => {
    const schema = z.object({ title: z.string() });
    const body = JSON.stringify({ title: "Test" });

    const result = validate(schema, body);

    expect(result).toEqual({ title: "Test" });
  });
});

