import { authenticateRequest } from "@/lib/auth";
import { ApiError } from "@/lib/security/errors";
import { signToken, verifyToken } from "@/lib/jwt";

type DocumentPurpose = "order-invoice";

type DocumentTokenPayload = {
  purpose: DocumentPurpose;
  orderId: string;
  email: string;
};

export async function createOrderInvoiceAccessToken(input: {
  orderId: string;
  email: string;
}) {
  return signToken(
    {
      purpose: "order-invoice",
      orderId: input.orderId,
      email: input.email.toLowerCase(),
    },
    "15m"
  );
}

export async function authorizeOrderInvoiceAccess(
  req: Request,
  orderId: string
) {
  const user = await authenticateRequest(req);
  if (user?.role === "ADMIN") {
    return { user, access: "admin" as const };
  }

  const accessToken = new URL(req.url).searchParams.get("accessToken");
  if (!accessToken) {
    throw new ApiError(401, "Invoice access requires authorization", "UNAUTHORIZED");
  }

  const payload = await verifyToken(accessToken);
  if (!payload) {
    throw new ApiError(401, "Invalid invoice access token", "INVALID_DOCUMENT_TOKEN");
  }

  const tokenPayload = payload as unknown as Partial<DocumentTokenPayload>;
  if (
    tokenPayload.purpose !== "order-invoice" ||
    tokenPayload.orderId !== orderId ||
    !tokenPayload.email
  ) {
    throw new ApiError(403, "Invoice access denied", "FORBIDDEN");
  }

  return { user: null, access: "token" as const, email: tokenPayload.email };
}
