import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { z } from "zod";
import { getSessionCookieOptions } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/security/errors";
import { enforceRateLimit, withRateLimitHeaders } from "@/lib/security/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/request";
import { parseJsonBody } from "@/lib/security/validation";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(req: NextRequest) {
    try {
        assertTrustedOrigin(req);
        const rateLimit = enforceRateLimit(req, "login");
        const validatedData = await parseJsonBody(req, loginSchema);

        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (!user) {
            return withRateLimitHeaders(
                jsonError(401, "Invalid credentials", "INVALID_CREDENTIALS"),
                rateLimit
            );
        }

        const passwordMatch = await bcrypt.compare(
            validatedData.password,
            user.password
        );

        if (!passwordMatch) {
            return withRateLimitHeaders(
                jsonError(401, "Invalid credentials", "INVALID_CREDENTIALS"),
                rateLimit
            );
        }

        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json(
            { message: "Login successful", user: { id: user.id, email: user.email, name: user.name } },
            { status: 200 }
        );

        response.cookies.set("token", token, getSessionCookieOptions());

        return withRateLimitHeaders(response, rateLimit);
    } catch (error) {
        return handleApiError(error);
    }
}
