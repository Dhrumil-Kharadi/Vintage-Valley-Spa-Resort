"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const requireAuth = (req, _res, next) => {
    const token = req.cookies?.[env_1.env.JWT_COOKIE_NAME];
    if (!token)
        return next(new errorHandler_1.HttpError(401, "Unauthorized"));
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        return next();
    }
    catch {
        return next(new errorHandler_1.HttpError(401, "Unauthorized"));
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = (req, _res, next) => {
    if (!req.user)
        return next(new errorHandler_1.HttpError(401, "Unauthorized"));
    if (req.user.role !== "ADMIN")
        return next(new errorHandler_1.HttpError(403, "Forbidden"));
    return next();
};
exports.requireAdmin = requireAdmin;
