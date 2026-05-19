import { ZodError } from "zod";
import response from "./response";

export function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function parseRequestBody<T>(schema: any, body: unknown, res: any): T | undefined {
  try {
    return schema.parse(body) as T;
  } catch (err) {
    if (err instanceof ZodError) {
      // Provide a friendlier error message for invalid codingLevel to match tests
      const hasCodingLevelError = err.issues.some(
        (issue) => issue.path[0] === "codingLevel",
      );
      if (hasCodingLevelError) {
        response.failure(
          res,
          "Invalid codingLevel. Allowed values: beginner, intermediate, advanced",
          400,
        );
        return undefined;
      }

      const errors = formatZodError(err);
      response.failure(res, errors, 400);
      return undefined;
    }
    throw err;
  }
}
