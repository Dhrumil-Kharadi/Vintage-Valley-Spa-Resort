"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const authService_1 = require("../services/authService");
const jwt_1 = require("../utils/jwt");
const cookies_1 = require("../utils/cookies");
const env_1 = require("../config/env");
const crypto_1 = __importDefault(require("crypto"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const forgotSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6),
});
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6).optional(),
});
exports.authController = {
    signup: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = signupSchema.parse(req.body);
        const user = await authService_1.authService.signup(body);
        const token = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
        (0, cookies_1.setAuthCookie)(res, token);
        res.json({ ok: true, data: { user } });
    }),
    googleStart: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!env_1.env.GOOGLE_CLIENT_ID || !env_1.env.GOOGLE_REDIRECT_URL) {
            res.status(500).json({ ok: false, error: { message: "Google OAuth not configured" } });
            return;
        }
        const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "";
        const state = crypto_1.default.randomBytes(16).toString("hex");
        const cookieOpts = (0, cookies_1.getAuthCookieOptions)();
        res.cookie("oauth_state", state, {
            ...cookieOpts,
            maxAge: 10 * 60 * 1000,
        });
        res.cookie("oauth_redirect", redirect, {
            ...cookieOpts,
            maxAge: 10 * 60 * 1000,
        });
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        url.searchParams.set("client_id", env_1.env.GOOGLE_CLIENT_ID);
        url.searchParams.set("redirect_uri", env_1.env.GOOGLE_REDIRECT_URL);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", "openid email profile");
        url.searchParams.set("state", state);
        url.searchParams.set("prompt", "select_account");
        res.redirect(url.toString());
    }),
    googleCallback: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!env_1.env.GOOGLE_CLIENT_ID || !env_1.env.GOOGLE_CLIENT_SECRET || !env_1.env.GOOGLE_REDIRECT_URL) {
            res.status(500).json({ ok: false, error: { message: "Google OAuth not configured" } });
            return;
        }
        const code = typeof req.query.code === "string" ? req.query.code : "";
        const state = typeof req.query.state === "string" ? req.query.state : "";
        const expectedState = String(req.cookies?.oauth_state ?? "");
        const redirect = String(req.cookies?.oauth_redirect ?? "");
        if (!code) {
            res.redirect(`${env_1.env.CLIENT_URL}/login?oauth=failed`);
            return;
        }
        if (!state || !expectedState || state !== expectedState) {
            res.redirect(`${env_1.env.CLIENT_URL}/login?oauth=failed`);
            return;
        }
        const tokenRes = await (0, node_fetch_1.default)("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: env_1.env.GOOGLE_CLIENT_ID,
                client_secret: env_1.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: env_1.env.GOOGLE_REDIRECT_URL,
                grant_type: "authorization_code",
            }).toString(),
        });
        const tokenData = await tokenRes.json().catch(() => null);
        if (!tokenRes.ok || !tokenData?.access_token) {
            res.redirect(`${env_1.env.CLIENT_URL}/login?oauth=failed`);
            return;
        }
        const userRes = await (0, node_fetch_1.default)("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const userInfo = await userRes.json().catch(() => null);
        const email = String(userInfo?.email ?? "").trim();
        const name = String(userInfo?.name ?? userInfo?.given_name ?? "").trim();
        const emailVerified = userInfo?.email_verified;
        if (!email || emailVerified === false) {
            res.redirect(`${env_1.env.CLIENT_URL}/login?oauth=failed`);
            return;
        }
        const user = await authService_1.authService.findOrCreateFromGoogle({ email, name: name || "Guest" });
        const token = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
        (0, cookies_1.setAuthCookie)(res, token);
        const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/";
        res.redirect(`${env_1.env.CLIENT_URL}${safeRedirect}`);
    }),
    login: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = loginSchema.parse(req.body);
        const user = await authService_1.authService.login(body);
        const token = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
        (0, cookies_1.setAuthCookie)(res, token);
        res.json({ ok: true, data: { user } });
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        (0, cookies_1.clearAuthCookie)(res);
        res.json({ ok: true });
    }),
    me: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const user = await authService_1.authService.me(req.user.userId);
        res.json({ ok: true, data: { user } });
    }),
    forgotPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = forgotSchema.parse(req.body);
        const token = await authService_1.authService.createResetToken(body.email);
        res.json({ ok: true, data: { resetToken: token ?? null } });
    }),
    resetPassword: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = resetSchema.parse(req.body);
        await authService_1.authService.resetPassword(body);
        res.json({ ok: true });
    }),
    updateProfile: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = updateProfileSchema.parse(req.body);
        const updated = await authService_1.authService.updateProfile(req.user.userId, body);
        res.json({ ok: true, data: { user: updated } });
    }),
};
