import { z } from "zod";
import { asyncHandler } from "../../../Backend/src/utils/asyncHandler";
import { adminAuthService } from "../services/adminAuthService";
import { signAccessToken } from "../../../Backend/src/utils/jwt";
import { clearAuthCookie, setAuthCookie } from "../../../Backend/src/utils/cookies";
import { AuthedRequest } from "../../../Backend/src/middlewares/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export const adminAuthController = {
  login: asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    const adminUser = await adminAuthService.loginAdmin(body);

    const token = signAccessToken({ userId: adminUser.id, role: adminUser.role });
    setAuthCookie(res, token);

    res.json({ ok: true, data: { user: adminUser } });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body ?? {});
    await adminAuthService.createAdminResetToken({ email: body.email });
    res.json({ ok: true });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    await adminAuthService.resetAdminPassword({ token: body.token, newPassword: body.newPassword });
    res.json({ ok: true });
  }),

  logout: asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  }),

  me: asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ ok: true, data: { user: req.user } });
  }),
};
