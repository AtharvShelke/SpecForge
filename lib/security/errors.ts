import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code = "API_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonError(
  status: number,
  message: string,
  code = "API_ERROR",
  details?: unknown
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.status, error.message, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError(400, "Validation failed", "VALIDATION_ERROR", {
      issues: error.issues,
    });
  }

  console.error(error);
  return jsonError(500, "Internal server error", "INTERNAL_SERVER_ERROR");
}
