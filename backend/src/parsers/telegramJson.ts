import fs from "fs";

export interface ParsedMessage {
  messageId: string;
  senderName?: string;
  senderId?: string;
  timestamp: Date;
  text: string;
  mediaType?: string;
  reactions?: unknown;
  emojis: string[];
  replyTo?: string;
}

export interface ParsedChat {
  title: string;
  type: string;
  participants: Array<{ id: string; name?: string }>;
  messages: ParsedMessage[];
}

interface TelegramJsonMessage {
  id?: number | string;
  type?: string;
  date?: string;
  date_unixtime?: string;
  from?: string;
  from_id?: string;
  text?: string | Array<string | { text?: string }>;
  media_type?: string;
  mime_type?: string;
  reactions?: unknown;
  reply_to_message_id?: number | string;
}

interface TelegramJsonExport {
  name?: string;
  title?: string;
  type?: string;
  messages?: TelegramJsonMessage[];
}

function normalizeTextContent(input: TelegramJsonMessage["text"]): string {
  if (typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        return part.text ?? "";
      })
      .join("");
  }
  return "";
}

function toDate(date?: string, unix?: string): Date | null {
  if (unix && !Number.isNaN(Number(unix))) {
    return new Date(Number(unix) * 1000);
  }
  if (date) {
    const parsed = Date.parse(date);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }
  return null;
}

export async function parseTelegramJsonExport(filePath: string): Promise<ParsedChat> {
  const raw = await fs.promises.readFile(filePath, "utf8");
  const payload = JSON.parse(raw) as TelegramJsonExport;

  if (!payload.messages) {
    throw new Error("Invalid Telegram JSON export: messages missing");
  }

  const participants = new Map<string, { id: string; name?: string }>();
  const messages: ParsedMessage[] = [];

  payload.messages.forEach((item, index) => {
    const timestamp = toDate(item.date, item.date_unixtime);
    if (!timestamp) {
      return;
    }
    const text = normalizeTextContent(item.text ?? "");
    const senderId = item.from_id ? String(item.from_id) : undefined;
    const senderName = item.from ? item.from : undefined;
    const messageId = String(item.id ?? index);

    if (senderId || senderName) {
      const id = senderId ?? senderName ?? "unknown";
      if (!participants.has(id)) {
        participants.set(id, { id, name: senderName ?? id });
      }
    }

    messages.push({
      messageId,
      senderId,
      senderName,
      timestamp,
      text,
      mediaType: item.media_type ?? item.mime_type,
      reactions: item.reactions,
      emojis: [],
      replyTo: item.reply_to_message_id ? String(item.reply_to_message_id) : undefined
    });
  });

  return {
    title: payload.title ?? payload.name ?? "Telegram Chat",
    type: payload.type ?? "unknown",
    participants: Array.from(participants.values()),
    messages
  };
}
