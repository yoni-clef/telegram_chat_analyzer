import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";
import { uploadChat } from "../controllers/uploadController";

const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 1024 * 1024 * 200 }
});

export const uploadRouter = Router();

uploadRouter.post("/chat", requireAuth, upload.array("files", 1000), uploadChat);
