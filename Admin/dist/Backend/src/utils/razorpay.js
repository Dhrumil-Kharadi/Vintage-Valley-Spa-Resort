"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpayClient = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("../config/env");
const getRazorpayClient = () => {
    if (!env_1.env.RAZORPAY_KEY_ID || !env_1.env.RAZORPAY_KEY_SECRET)
        return null;
    return new razorpay_1.default({
        key_id: env_1.env.RAZORPAY_KEY_ID,
        key_secret: env_1.env.RAZORPAY_KEY_SECRET,
    });
};
exports.getRazorpayClient = getRazorpayClient;
