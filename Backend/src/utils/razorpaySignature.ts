import crypto from "crypto";
import { env } from "../config/env";

export const verifyRazorpaySignature = (params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) => {
  if (!env.RAZORPAY_KEY_SECRET) return false;

  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === params.signature;
};
