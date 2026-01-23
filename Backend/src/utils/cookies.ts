import { CookieOptions, Response } from "express";
import { env } from "../config/env";

export const getAuthCookieOptions = (): CookieOptions => {
  const isProd = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: env.COOKIE_SECURE || isProd,
    path: "/",
  };
};

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(env.JWT_COOKIE_NAME, token, getAuthCookieOptions());
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
};
