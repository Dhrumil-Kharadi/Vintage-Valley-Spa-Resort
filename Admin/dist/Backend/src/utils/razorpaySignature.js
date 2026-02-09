"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpaySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const verifyRazorpaySignature = (params) => {
    if (!env_1.env.RAZORPAY_KEY_SECRET)
        return false;
    const body = `${params.orderId}|${params.paymentId}`;
    const expected = crypto_1.default
        .createHmac("sha256", env_1.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
    return expected === params.signature;
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
