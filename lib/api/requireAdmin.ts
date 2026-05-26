import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      ),
    };
  }

  return { user };
}