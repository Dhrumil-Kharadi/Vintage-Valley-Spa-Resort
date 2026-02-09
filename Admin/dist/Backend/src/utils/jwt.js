"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const signAccessToken = (payload) => {
    const secret = env_1.env.JWT_SECRET;
    const options = {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.signAccessToken = signAccessToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
