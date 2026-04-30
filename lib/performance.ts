import { NextResponse } from "next/server";

const SLOW_ENDPOINT_MS = 500;

export async function measureRoute<T>(
  label: string,
  handler: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await handler();
  } finally {
    const duration = Math.round(performance.now() - startedAt);
    if (process.env.NODE_ENV === "development" && duration > SLOW_ENDPOINT_MS) {
      console.warn(
        `[perf:api] slow endpoint ${label} (${duration}ms) threshold=${SLOW_ENDPOINT_MS}ms`,
      );
    }
  }
}

export function jsonWithTiming<T>(
  label: string,
  payload: T,
  init?: ResponseInit,
) {
  return measureRoute(label, async () => NextResponse.json(payload, init));
}
