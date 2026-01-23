import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "../config/env";
import { HttpError } from "./errorHandler";

export type AuthedRequest = Request & {
  user?: {
    userId: string;
    role: "USER" | "ADMIN";
  };
};

export const requireAuth = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[env.JWT_COOKIE_NAME];
  if (!token) return next(new HttpError(401, "Unauthorized"));

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch {
    return next(new HttpError(401, "Unauthorized"));
  }
};

export const requireAdmin = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new HttpError(401, "Unauthorized"));
  if (req.user.role !== "ADMIN") return next(new HttpError(403, "Forbidden"));
  return next();
};
