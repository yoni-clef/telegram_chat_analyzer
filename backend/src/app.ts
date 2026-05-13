import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { uploadRouter } from "./routes/upload";
import { analyticsRouter } from "./routes/analytics";
import { errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/analytics", analyticsRouter);

  app.use(errorHandler);

  return app;
}
