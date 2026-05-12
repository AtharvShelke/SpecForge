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

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
    try {
        assertTrustedOrigin(req);
        const rateLimit = enforceRateLimit(req, "register");
        const validatedData = await parseJsonBody(req, registerSchema);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return withRateLimitHeaders(
                jsonError(409, "User already exists", "USER_EXISTS"),
                rateLimit
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
            },
        });

        // Generate token
        const token = await signToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: "Registration successful",
                user: { id: user.id, email: user.email, name: user.name }
            },
            { status: 201 }
        );

        // Set cookie
        response.cookies.set("token", token, getSessionCookieOptions());

        return withRateLimitHeaders(response, rateLimit);
    } catch (error) {
        return handleApiError(error);
    }
}
