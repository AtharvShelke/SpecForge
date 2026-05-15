import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { handleApiError } from "@/lib/security/errors";
import { assertTrustedOrigin } from "@/lib/security/request";

export async function POST(req: NextRequest) {
    try {
        assertTrustedOrigin(req);

        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        );

        response.cookies.set(SESSION_COOKIE_NAME, "", {
            ...getSessionCookieOptions(),
            maxAge: 0,
        });

        return response;
    } catch (error) {
        return handleApiError(error);
    }
}
