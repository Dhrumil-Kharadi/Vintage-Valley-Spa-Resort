import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/authService";
import { signAccessToken } from "../utils/jwt";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies";
import { AuthedRequest } from "../middlewares/auth";

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

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const body = signupSchema.parse(req.body);
    const user = await authService.signup(body);

    const token = signAccessToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    res.json({ ok: true, data: { user } });
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
};
