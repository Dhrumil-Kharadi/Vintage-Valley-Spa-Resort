import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/authService";
import { signAccessToken } from "../utils/jwt";
import { clearAuthCookie, getAuthCookieOptions, setAuthCookie } from "../utils/cookies";
import { AuthedRequest } from "../middlewares/auth";
import { env } from "../config/env";
import crypto from "crypto";
import fetch from "node-fetch";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);
    const user = await authService.signup(body);

    const token = signAccessToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    res.json({ ok: true, data: { user } });
  }),

  googleStart: asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URL) {
      res.status(500).json({ ok: false, error: { message: "Google OAuth not configured" } });
      return;
    }

    const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "";
    const state = crypto.randomBytes(16).toString("hex");

    const cookieOpts = getAuthCookieOptions();
    res.cookie("oauth_state", state, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("oauth_redirect", redirect, {
      ...cookieOpts,
      maxAge: 10 * 60 * 1000,
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URL);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    res.redirect(url.toString());
  }),

  googleCallback: asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URL) {
      res.status(500).json({ ok: false, error: { message: "Google OAuth not configured" } });
      return;
    }

    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expectedState = String((req as any).cookies?.oauth_state ?? "");
    const redirect = String((req as any).cookies?.oauth_redirect ?? "");

    if (!code) {
      res.redirect(`${env.CLIENT_URL}/login?oauth=failed`);
      return;
    }
    if (!state || !expectedState || state !== expectedState) {
      res.redirect(`${env.CLIENT_URL}/login?oauth=failed`);
      return;
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URL,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData: any = await tokenRes.json().catch(() => null);
    if (!tokenRes.ok || !tokenData?.access_token) {
      res.redirect(`${env.CLIENT_URL}/login?oauth=failed`);
      return;
    }

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo: any = await userRes.json().catch(() => null);
    const email = String(userInfo?.email ?? "").trim();
    const name = String(userInfo?.name ?? userInfo?.given_name ?? "").trim();
    const emailVerified = userInfo?.email_verified;

    if (!email || emailVerified === false) {
      res.redirect(`${env.CLIENT_URL}/login?oauth=failed`);
      return;
    }

    const user = await authService.findOrCreateFromGoogle({ email, name: name || "Guest" });
    const token = signAccessToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/";
    res.redirect(`${env.CLIENT_URL}${safeRedirect}`);
  }),

  login: asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await authService.login(body);

    const token = signAccessToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    res.json({ ok: true, data: { user } });
  }),

  logout: asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  }),

  me: asyncHandler(async (req: AuthedRequest, res) => {
    const user = await authService.me(req.user!.userId);
    res.json({ ok: true, data: { user } });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const body = forgotSchema.parse(req.body);
    const token = await authService.createResetToken(body.email);

    res.json({ ok: true, data: { resetToken: token ?? null } });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const body = resetSchema.parse(req.body);
    await authService.resetPassword(body);
    res.json({ ok: true });
  }),

  updateProfile: asyncHandler(async (req: AuthedRequest, res) => {
    const body = updateProfileSchema.parse(req.body);
    const updated = await authService.updateProfile(req.user!.userId, body);
    res.json({ ok: true, data: { user: updated } });
  }),
};
