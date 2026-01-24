import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { errorHandler } from "../../Backend/src/middlewares/errorHandler";
import { notFoundHandler } from "../../Backend/src/middlewares/notFoundHandler";
import { adminApiRouter } from "./routes";

export const createServer = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL ?? "http://localhost:8080",
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/admin-api", adminApiRouter);

  app.use(notFoundHandler);

  app.use((err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
    console.error("Admin backend error:", err);
    next(err);
  });
  app.use(errorHandler);

  return app;
};
