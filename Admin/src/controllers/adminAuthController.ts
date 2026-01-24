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

export const adminAuthController = {
  login: asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    const adminUser = await adminAuthService.loginAdmin(body);

    const token = signAccessToken({ userId: adminUser.id, role: adminUser.role });
    setAuthCookie(res, token);

    res.json({ ok: true, data: { user: adminUser } });
  }),

  logout: asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  }),

  me: asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ ok: true, data: { user: req.user } });
  }),
};
