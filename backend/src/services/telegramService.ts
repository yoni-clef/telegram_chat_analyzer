import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import { pool } from "../db";
import { extractEmojis } from "../utils/emoji";
import { parseTelegramJsonExport, ParsedChat } from "../parsers/telegramJson";
import { isTelegramMessagesHtml, parseTelegramHtmlExport, TelegramHtmlFile } from "../parsers/telegramHtml";

function uploadBasename(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function findResultJson(files: string[]): string | null {
  const match = files.find((file) => uploadBasename(file).toLowerCase() === "result.json");
  return match ?? null;
}

async function extractZipToTemp(zipPath: string): Promise<string> {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "telegram-export-"));
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tempDir, true);
  return tempDir;
}

async function collectFiles(root: string): Promise<string[]> {
  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function findResultJsonInFolder(uploadedFiles: Express.Multer.File[]): string | null {
  const match = uploadedFiles.find((file) => uploadBasename(file.originalname).toLowerCase() === "result.json");
  return match?.path ?? null;
}

function findMessagesHtml(files: string[]): TelegramHtmlFile[] {
  return files.filter(isTelegramMessagesHtml);
}

function findMessagesHtmlInFolder(uploadedFiles: Express.Multer.File[]): TelegramHtmlFile[] {
  return uploadedFiles
    .filter((file) => isTelegramMessagesHtml(uploadBasename(file.originalname)))
    .map((file) => ({ path: file.path, name: file.originalname }));
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function ingestTelegramExport(
  uploadedFiles: Express.Multer.File[],
  userId: number
) {
  let resultJson: string | null = null;
  let messagesHtml: TelegramHtmlFile[] = [];
  let cleanupPath: string | null = null;

  try {
    if (uploadedFiles.length === 1) {
      const file = uploadedFiles[0];
      const ext = path.extname(file.originalname).toLowerCase();

      if (ext === ".json") {
        resultJson = file.path;
      } else if (ext === ".html" && isTelegramMessagesHtml(file.originalname)) {
        messagesHtml = [{ path: file.path, name: file.originalname }];
      } else if (ext === ".zip") {
        const tempDir = await extractZipToTemp(file.path);
        cleanupPath = tempDir;
        const files = await collectFiles(tempDir);
        resultJson = findResultJson(files);
        messagesHtml = findMessagesHtml(files);
      }
    } else {
      resultJson = findResultJsonInFolder(uploadedFiles);
      messagesHtml = findMessagesHtmlInFolder(uploadedFiles);
    }

    if (!resultJson && messagesHtml.length === 0) {
      throw new Error("result.json or messages*.html not found in export");
    }

    const parsed = resultJson
      ? await parseTelegramJsonExport(resultJson)
      : await parseTelegramHtmlExport(messagesHtml);
    parsed.messages = parsed.messages.map((message) => ({
      ...message,
      emojis: extractEmojis(message.text)
    }));

    return await saveChat(parsed, userId);
  } finally {
    if (cleanupPath) {
      await fs.promises.rm(cleanupPath, { recursive: true, force: true });
    }

    for (const file of uploadedFiles) {
      await fs.promises.unlink(file.path).catch(() => {});
    }
  }
}

async function saveChat(chat: ParsedChat, userId: number): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const chatResult = await client.query(
      "INSERT INTO chats (user_id, title, type, participants) VALUES ($1, $2, $3, $4) RETURNING id",
      [userId, chat.title, chat.type, JSON.stringify(chat.participants)]
    );
    const chatId = chatResult.rows[0].id as number;

    const chunks = chunkArray(chat.messages, 500);
    for (const chunk of chunks) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      chunk.forEach((message, index) => {
        const offset = index * 10;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
        );
        values.push(
          chatId,
          message.messageId,
          message.senderName ?? null,
          message.senderId ?? null,
          message.timestamp,
          message.text,
          message.mediaType ?? null,
          message.emojis.length ? message.emojis : null,
          message.reactions ? JSON.stringify(message.reactions) : null,
          message.replyTo ?? null
        );
      });

      const sql = `INSERT INTO messages
        (chat_id, message_id, sender_name, sender_id, timestamp, text, media_type, emojis, reactions, reply_to)
        VALUES ${placeholders.join(",")}`;

      await client.query(sql, values);
    }

    await client.query("COMMIT");
    return chatId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
