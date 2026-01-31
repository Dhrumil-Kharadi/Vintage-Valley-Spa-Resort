import { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: { message: err.message },
    });
  }

  const message = err instanceof Error ? err.message : "Internal Server Error";
  const stack = err instanceof Error ? err.stack : undefined;

  if (env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return res.status(500).json({
    ok: false,
    error: {
      message: env.NODE_ENV === "production" ? "Internal Server Error" : message,
      ...(env.NODE_ENV === "production" ? {} : { stack }),
    },
  });
};
