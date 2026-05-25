import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { globalRateLimit } from "./middlewares/rate-limit.middleware.js";
import { sanitizeMiddleware } from "./middlewares/sanitize.middleware.js";
import router from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  );

  app.use(helmet());
  app.use(globalRateLimit);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitizeMiddleware);

  app.use("/api", router);
  app.use(errorMiddleware);

  return app;
}
