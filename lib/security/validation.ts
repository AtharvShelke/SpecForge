import type { ZodType } from "zod";
import { ApiError } from "@/lib/security/errors";

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", {
      issues: parsed.error.issues,
    });
  }

  return parsed.data;
}
