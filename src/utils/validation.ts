import { ZodError, ZodSchema } from "zod";
import { Response } from "express";
import response from "./response";

export function formatZodError(error: ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function parseRequestBody<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | undefined {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = formatZodError(err);
      response.failure(res, errors, 400);
      return undefined;
    }
    throw err;
  }
}
