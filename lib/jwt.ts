import { type JWTPayload, SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

const secret = new TextEncoder().encode(getJwtSecret());

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn: string | number = "2h"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken<T extends JWTPayload = JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload as T;
  } catch {
    return null;
  }
}
