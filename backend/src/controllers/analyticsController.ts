import { Request, Response, NextFunction } from "express";
import {
  getActivity,
  getEmojiStats,
  getMediaStats,
  getMessages,
  getSummary,
  listChats
} from "../analytics/metrics";
import Sentiment from "sentiment";
import { pool } from "../db";

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const result = await getSummary(chatId);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function messages(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const limit = Number(req.query.limit ?? 50);
    const page = Number(req.query.page ?? 1);
    const offset = (page - 1) * limit;
    const result = await getMessages(chatId, limit, offset);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function emojis(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const result = await getEmojiStats(chatId);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function activity(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const result = await getActivity(chatId);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function media(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const result = await getMediaStats(chatId);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}

export async function sentiment(req: Request, res: Response, next: NextFunction) {
  try {
    const chatId = Number(req.params.chatId);
    const sentiment = new Sentiment();
    const query = await pool.query(
      "SELECT text FROM messages WHERE chat_id = $1 AND text IS NOT NULL",
      [chatId]
    );

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    query.rows.forEach((row) => {
      const score = sentiment.analyze(row.text).score;
      if (score > 0) {
        positive += 1;
      } else if (score < 0) {
        negative += 1;
      } else {
        neutral += 1;
      }
    });

    res.json({ positive, negative, neutral });
  } catch (error) {
    next(error as Error);
  }
}

export async function chats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new Error("Unauthorized");
    }
    const result = await listChats(req.user.id);
    res.json(result);
  } catch (error) {
    next(error as Error);
  }
}
