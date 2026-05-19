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
      const errors = formatZodError(err);
      response.failure(res, errors, 400);
      return undefined;
    }
    throw err;
  }
}
