import { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: { message: `Route not found: ${req.method} ${req.path}` },
  });
};
