import { Request, Response, NextFunction } from "express";
import { ingestTelegramExport } from "../services/telegramService";

export async function uploadChat(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new Error("No file uploaded");
    }
    if (!req.user) {
      throw new Error("Unauthorized");
    }

    const files = req.files as Express.Multer.File[];
    const hasSingleZip = files.length === 1 && files[0].originalname.toLowerCase().endsWith(".zip");
    const hasSingleJson = files.length === 1 && files[0].originalname.toLowerCase().endsWith(".json");
    const hasSingleHtml = files.length === 1 && files[0].originalname.toLowerCase().endsWith(".html");
    const isFolder = files.length > 1;

    if (!hasSingleZip && !hasSingleJson && !hasSingleHtml && !isFolder) {
      throw new Error("Upload must be a .json file, a .html file, a .zip file, or a folder");
    }

    const chatId = await ingestTelegramExport(files, req.user.id);
    res.json({ chatId });
  } catch (error) {
    next(error as Error);
  }
}
