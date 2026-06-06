import { createHmac } from "crypto";

// Prevent this file from being bundled in the client
if (typeof window !== "undefined") {
  throw new Error("This module can only be used on the server side");
}

export function getRazorpayConfig() {
  return {
    keyId:
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
}

export function getManualPaymentDetails() {
  return {
    upiId: process.env.NEXT_PUBLIC_STORE_UPI_ID || "",
    upiName: process.env.NEXT_PUBLIC_STORE_UPI_NAME || "",
    bankAccountName: process.env.NEXT_PUBLIC_STORE_BANK_ACCOUNT_NAME || "",
    bankAccountNumber: process.env.NEXT_PUBLIC_STORE_BANK_ACCOUNT_NUMBER || "",
    bankIfsc: process.env.NEXT_PUBLIC_STORE_BANK_IFSC || "",
    bankName: process.env.NEXT_PUBLIC_STORE_BANK_NAME || "",
    bankBranch: process.env.NEXT_PUBLIC_STORE_BANK_BRANCH || "",
  };
}

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  keySecret: string;
}) {
  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
}
