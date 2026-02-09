"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookie = exports.setAuthCookie = exports.getAuthCookieOptions = void 0;
const env_1 = require("../config/env");
const getAuthCookieOptions = () => {
    const isProd = env_1.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: env_1.env.COOKIE_SECURE || isProd,
        path: "/",
    };
};
exports.getAuthCookieOptions = getAuthCookieOptions;
const setAuthCookie = (res, token) => {
    res.cookie(env_1.env.JWT_COOKIE_NAME, token, (0, exports.getAuthCookieOptions)());
};
exports.setAuthCookie = setAuthCookie;
const clearAuthCookie = (res) => {
    res.clearCookie(env_1.env.JWT_COOKIE_NAME, { path: "/" });
};
exports.clearAuthCookie = clearAuthCookie;
