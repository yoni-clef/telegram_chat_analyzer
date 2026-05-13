import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  JWT_SECRET: z.string().min(16),
  DATABASE_URL: z.string().min(1),
  UPLOAD_DIR: z.string().default("uploads")
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR
});
