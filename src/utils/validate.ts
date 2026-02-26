import { ZodType } from "zod";
import { ValidationError } from "./errors";

export function validate<T>(
  schema: ZodType<T>,
  body: string | null
): T {
  if (!body) {
    throw new ValidationError("Request body is required");
  }

  const parsed = schema.safeParse(JSON.parse(body));

  if (!parsed.success) {
    const details = parsed.error.issues.map(issue => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    throw new ValidationError("Validation failed", details);
  }

  return parsed.data;
}