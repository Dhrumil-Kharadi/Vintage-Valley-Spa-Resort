"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthController = void 0;
const zod_1 = require("zod");
const asyncHandler_1 = require("../../../Backend/src/utils/asyncHandler");
const adminAuthService_1 = require("../services/adminAuthService");
const jwt_1 = require("../../../Backend/src/utils/jwt");
const cookies_1 = require("../../../Backend/src/utils/cookies");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.adminAuthController = {
    login: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const body = loginSchema.parse(req.body);
        const adminUser = await adminAuthService_1.adminAuthService.loginAdmin(body);
        const token = (0, jwt_1.signAccessToken)({ userId: adminUser.id, role: adminUser.role });
        (0, cookies_1.setAuthCookie)(res, token);
        res.json({ ok: true, data: { user: adminUser } });
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
        (0, cookies_1.clearAuthCookie)(res);
        res.json({ ok: true });
    }),
    me: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        res.json({ ok: true, data: { user: req.user } });
    }),
};
